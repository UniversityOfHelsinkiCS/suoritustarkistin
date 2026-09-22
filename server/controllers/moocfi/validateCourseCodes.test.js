/**
 * The course code check, end to end from the HTTP request to Suotar's course list.
 *
 * The importer is started but never answers anything here: an endpoint that reached it would
 * fail its fixtureless requests, which is the point.
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

const db = require('@server/models/index')

const PATH = '/api/moocfi/course-codes/validate'
const CODE = 'TKT10001'

const seedCourse = async (courseCode = CODE, name = 'Intro') =>
  await db.courses.create({ name, courseCode, language: 'fi', credits: '5' })

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

const validate = (items) => post(PATH, items, { token })

describe('checking a course code', () => {
  test('answers courseAllowed for a course Suotar carries', async () => {
    await seedCourse()

    const { status, body } = await validate([{ requestItemId: 'course-1', courseCode: CODE }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'course-1',
        status: 'ok',
        code: 'courseAllowed',
        result: { courseCode: CODE, name: 'Intro' }
      }
    ])
  })

  test('answers courseNotAllowed for a course code Suotar does not carry', async () => {
    const { status, body } = await validate([{ requestItemId: 'course-1', courseCode: CODE }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'course-1',
        status: 'error',
        code: 'courseNotAllowed',
        error: { message: 'Suotar does not carry this course code.' }
      }
    ])
  })

  test('answers courseNotAllowed for Elements of AI and Building AI, which are not settled yet', async () => {
    const codes = ['TKT21018', 'TKT210281', 'AYTKT21018sv']
    // Seeded like any other course, so the block is what refuses them and not their absence.
    for (const courseCode of codes) await seedCourse(courseCode)

    const { body } = await validate(codes.map((courseCode, i) => ({ requestItemId: `c${i}`, courseCode })))

    assert.deepEqual(
      body.map(({ code }) => code),
      ['courseNotAllowed', 'courseNotAllowed', 'courseNotAllowed']
    )
    for (const { error } of body) assert.match(error.message, /cannot be registered through this API yet/)
  })
})

describe('batching', () => {
  test('answers a mixed batch in request order, from one query', async () => {
    await seedCourse()
    await seedCourse('TKT10002', 'Advanced')

    const { body } = await validate([
      { requestItemId: 'a', courseCode: 'NOSUCH' },
      { requestItemId: 'b', courseCode: CODE },
      { requestItemId: 'c', courseCode: 'TKT10002' },
      { requestItemId: 'd', courseCode: CODE }
    ])

    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['a', 'courseNotAllowed'],
        ['b', 'courseAllowed'],
        ['c', 'courseAllowed'],
        ['d', 'courseAllowed']
      ]
    )
  })

  test('answers an empty batch with an empty array', async () => {
    const { status, body } = await validate([])

    assert.equal(status, 200)
    assert.deepEqual(body, [])
  })

  test('reads nothing but Suotar itself', async () => {
    await seedCourse()

    await validate([{ requestItemId: 'a', courseCode: CODE }])

    assert.deepEqual(importer.requests, [], 'the check must not cost a Sisu lookup')
  })
})

describe('request-level validation', () => {
  test('rejects an item with no course code', async () => {
    const { status, body } = await validate([{ requestItemId: 'a', courseCode: CODE }, { requestItemId: 'b' }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /^Request item b:/, 'the message must name the offending item')
  })

  test('rejects an item whose course code is not a string', async () => {
    const { status, body } = await validate([{ requestItemId: 'a', courseCode: 10001 }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })
})

describe('authentication', () => {
  test('refuses a request with no API key', async () => {
    const { status, body } = await post(PATH, [{ requestItemId: 'a', courseCode: CODE }])

    assert.equal(status, 401)
    assert.deepEqual(body, { error: { code: 'unauthorized', message: 'Missing or invalid credentials.' } })
  })
})
