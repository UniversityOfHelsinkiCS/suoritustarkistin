/**
 * Spec section 4, end to end from the HTTP request to the importer call it makes.
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

const PATH = '/api/attainments/verify'
const STATUS_PATH = '/suotar/attainment-status'

const ATTAINMENT_ID = 'hy-kur-1'

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

// As the importer answers it: one row per asked-about id, its match or null.
const statusesFor = (attainmentById) => (req) =>
  (req.parsedBody || []).map((id) => ({ id, attainment: attainmentById[id] || null }))

const verify = (items) => post(PATH, items, { token })

describe('verifying an attainment Suotar submitted', () => {
  test('returns registered with the course unit attainment Sisu built', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        [ATTAINMENT_ID]: { id: 'hy-opintosuoritus-1', type: 'CourseUnitAttainment', misregistration: false }
      })
    })

    const { status, body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'verify-1',
        status: 'ok',
        code: 'registered',
        result: { attainment: { id: 'hy-opintosuoritus-1', type: 'CourseUnitAttainment' } }
      }
    ])
  })

  test('returns registered for partial evidence, naming the type so it is not mistaken for final', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        [ATTAINMENT_ID]: { id: ATTAINMENT_ID, type: 'AssessmentItemAttainment', misregistration: false }
      })
    })

    const { body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    assert.equal(body[0].code, 'registered')
    assert.deepEqual(body[0].result.attainment, { id: ATTAINMENT_ID, type: 'AssessmentItemAttainment' })
  })

  test('returns notRegistered while Sisu holds nothing', async () => {
    importer.respondByPath({ [STATUS_PATH]: statusesFor({}) })

    const { body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    assert.equal(body[0].status, 'error')
    assert.equal(body[0].code, 'notRegistered')
  })

  test('returns misregistered for an attainment Sisu has reversed', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        [ATTAINMENT_ID]: { id: 'hy-opintosuoritus-1', type: 'CourseUnitAttainment', misregistration: true }
      })
    })

    const { body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    assert.equal(body[0].status, 'error')
    assert.equal(body[0].code, 'misregistered')
  })

  test('asks the importer for the submitted id itself', async () => {
    importer.respondByPath({ [STATUS_PATH]: statusesFor({}) })

    await verify([{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    const [request] = importer.requests.filter(({ url }) => url.startsWith(STATUS_PATH))
    assert.deepEqual(request.body, [ATTAINMENT_ID])
  })
})

describe('verifying an id with no entry behind it', () => {
  test('answers from Sisu rather than from Suotar not recognising the id', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        'hy-kur-unknown-to-suotar': { id: 'hy-opintosuoritus-1', type: 'CourseUnitAttainment', misregistration: false }
      })
    })

    const { body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: 'hy-kur-unknown-to-suotar' }])

    assert.equal(body[0].code, 'registered')
  })

  test('returns notRegistered when Sisu does not hold it either', async () => {
    importer.respondByPath({ [STATUS_PATH]: statusesFor({}) })

    const { body } = await verify([{ requestItemId: 'verify-1', submittedAttainmentId: 'hy-kur-invented' }])

    assert.equal(body[0].code, 'notRegistered')
  })
})

describe('a batch', () => {
  test('answers every item, in request order, from one importer call', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        'hy-kur-2': { id: 'hy-opintosuoritus-2', type: 'CourseUnitAttainment', misregistration: false }
      })
    })

    const { body } = await verify([
      { requestItemId: 'verify-1', submittedAttainmentId: 'hy-kur-1' },
      { requestItemId: 'verify-2', submittedAttainmentId: 'hy-kur-2' },
      { requestItemId: 'verify-3', submittedAttainmentId: 'hy-kur-unknown' }
    ])

    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['verify-1', 'notRegistered'],
        ['verify-2', 'registered'],
        ['verify-3', 'notRegistered']
      ]
    )
    assert.equal(importer.requests.length, 1)
  })

  test('asks about an id repeated across items only once', async () => {
    importer.respondByPath({
      [STATUS_PATH]: statusesFor({
        [ATTAINMENT_ID]: { id: 'hy-opintosuoritus-1', type: 'CourseUnitAttainment', misregistration: false }
      })
    })

    const { body } = await verify([
      { requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID },
      { requestItemId: 'verify-2', submittedAttainmentId: ATTAINMENT_ID }
    ])

    assert.deepEqual(
      body.map(({ code }) => code),
      ['registered', 'registered']
    )
    assert.equal(importer.requests[0].body.length, 1)
  })
})

describe('when the importer cannot be reached', () => {
  test('fails the request with serviceTemporarilyUnavailable', async () => {
    importer.respondByPath({ [STATUS_PATH]: [] }, (url) => url.startsWith(STATUS_PATH))

    const { status, body } = await verify([
      { requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID },
      { requestItemId: 'verify-2', submittedAttainmentId: 'hy-kur-unknown' }
    ])

    assert.equal(status, 503)
    assert.deepEqual(body, {
      error: { code: 'serviceTemporarilyUnavailable', message: 'Failed to fetch Sisu data.' }
    })
  })
})

describe('a request the endpoint cannot read', () => {
  test('refuses an item with no submittedAttainmentId', async () => {
    const { status, body } = await verify([{ requestItemId: 'verify-1' }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })

  test('refuses a body that is not an array', async () => {
    const { status, body } = await post(PATH, { requestItemId: 'verify-1' }, { token })

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
  })
})

describe('the endpoint is behind the mooc.fi token', () => {
  test('refuses a request with no token', async () => {
    const { status } = await post(PATH, [{ requestItemId: 'verify-1', submittedAttainmentId: ATTAINMENT_ID }])

    assert.equal(status, 401)
  })
})
