/**
 * Spec section 1, end to end from the HTTP request to the importer call it makes.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  disconnectDatabase,
  truncateDatabase,
  createTestApiKey,
  importer,
  startImporter,
  stopImporter,
  startFullApp,
  stopApp,
  post
} = require('../../test/helpers')

const PATH = '/api/persons/resolve-by-student-numbers'

// A whole Person row, as POST /students returns it: the projection has something to drop.
const person = (studentNumber, overrides = {}) => ({
  id: `hy-hlo-${studentNumber}`,
  studentNumber,
  firstNames: 'Henrik Admin',
  lastName: 'Nygren',
  dateOfBirth: '1990-01-01T00:00:00.000Z',
  primaryEmail: 'henrik@helsinki.fi',
  secondaryEmail: 'henrik@example.com',
  ...overrides
})

let token

before(async () => {
  await connectDatabase()
  await startImporter()
  await startFullApp()
})

after(async () => {
  await stopApp()
  await stopImporter()
  await disconnectDatabase()
})

beforeEach(async () => {
  await truncateDatabase()
  importer.reset()
  ;[, token] = await createTestApiKey()
})

const resolve = (items) => post(PATH, items, { token })

describe('resolving a student number', () => {
  test('returns personFound with the person Sisu holds', async () => {
    importer.respondWith([person('012345678')])

    const { status, body } = await resolve([{ requestItemId: 'person-1', studentNumber: '012345678' }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'person-1',
        status: 'ok',
        code: 'personFound',
        result: {
          studentNumber: '012345678',
          personId: 'hy-hlo-012345678',
          firstNames: 'Henrik Admin',
          lastName: 'Nygren'
        }
      }
    ])
  })

  test('passes on nothing the spec does not name', async () => {
    importer.respondWith([person('012345678')])

    const { body } = await resolve([{ requestItemId: 'person-1', studentNumber: '012345678' }])

    assert.deepEqual(
      Object.keys(body[0].result).sort(),
      ['firstNames', 'lastName', 'personId', 'studentNumber'],
      "the importer returns whole Person rows, so only the spec's fields belong in the result"
    )
  })

  test('returns personNotFound when Sisu has no such student number', async () => {
    importer.respondWith([])

    const { status, body } = await resolve([{ requestItemId: 'person-1', studentNumber: '999999999' }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'person-1',
        status: 'error',
        code: 'personNotFound',
        error: { message: 'No Sisu person was found for the supplied student number.' }
      }
    ])
  })
})

describe('batching', () => {
  test('answers a mixed batch in request order', async () => {
    importer.respondWith([person('222222222'), person('000000000')])

    const { body } = await resolve([
      { requestItemId: 'a', studentNumber: '000000000' },
      { requestItemId: 'b', studentNumber: '999999999' },
      { requestItemId: 'c', studentNumber: '222222222' }
    ])

    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['a', 'personFound'],
        ['b', 'personNotFound'],
        ['c', 'personFound']
      ],
      'items must come back in request order regardless of the order the importer answered in'
    )
  })

  test('asks the importer once, for each distinct student number', async () => {
    importer.respondWith([person('000000000')])

    const { body } = await resolve([
      { requestItemId: 'a', studentNumber: '000000000' },
      { requestItemId: 'b', studentNumber: '000000000' }
    ])

    assert.equal(importer.requests.length, 1)
    assert.deepEqual(importer.requests[0].body, ['000000000'])
    assert.deepEqual(
      body.map(({ code }) => code),
      ['personFound', 'personFound'],
      'both items must be answered from the single deduplicated lookup'
    )
  })
})

describe('when the importer fails', () => {
  const assertEveryItemUnavailable = ({ status, body }) => {
    assert.equal(status, 200, 'an importer failure is a per-item outcome, not a request-level error')
    assert.deepEqual(body, [
      {
        requestItemId: 'a',
        status: 'error',
        code: 'sisuTemporarilyUnavailable',
        error: { message: 'Sisu was temporarily unavailable.' }
      },
      {
        requestItemId: 'b',
        status: 'error',
        code: 'sisuTemporarilyUnavailable',
        error: { message: 'Sisu was temporarily unavailable.' }
      }
    ])
  }

  const items = [
    { requestItemId: 'a', studentNumber: '000000000' },
    { requestItemId: 'b', studentNumber: '111111111' }
  ]

  test('fails every item when the importer answers 500', async () => {
    importer.handle = (_req, res) => {
      res.writeHead(500)
      res.end('{}')
    }

    assertEveryItemUnavailable(await resolve(items))
  })

  test('fails every item when the importer drops the connection', async () => {
    // The socket, not the request: destroying the IncomingMessage leaves the client
    // waiting on axios's 120s timeout instead of seeing the connection go.
    importer.handle = (req) => req.socket.destroy()

    assertEveryItemUnavailable(await resolve(items))
  })

  test('fails every item when the importer answers with something that is not an array', async () => {
    importer.respondWith({ error: 'nope' })

    assertEveryItemUnavailable(await resolve(items))
  })
})

describe('request-level validation', () => {
  test('rejects an item with no student number', async () => {
    const { status, body } = await resolve([{ requestItemId: 'a', studentNumber: '000000000' }, { requestItemId: 'b' }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /^Request item b:/, 'the message must name the offending item')
    assert.equal(importer.requests.length, 0, 'a malformed batch must not reach the importer')
  })

  test('rejects an item whose student number is not a string', async () => {
    const { status, body } = await resolve([{ requestItemId: 'a', studentNumber: 12345678 }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })
})
