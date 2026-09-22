/**
 * Spec section 6, end to end from the HTTP request to the importer calls it makes.
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

const PATH = '/api/moocfi/enrolments/list-by-course'

// A whole Enrolment row with a nested Person, as the importer returns it: personId sits on
// the enrolment, and the person carries five columns and no id.
const enrolment = (studentNumber, courseUnitRealisationId, overrides = {}) => ({
  id: `hy-opt-enr-${studentNumber}`,
  personId: `hy-hlo-${studentNumber}`,
  courseUnitRealisationId,
  studyRightId: 'hy-sr-1',
  state: 'ENROLLED',
  enrolmentDateTime: '2026-05-22T10:15:30.000Z',
  person: {
    studentNumber,
    firstNames: 'Henrik Admin',
    lastName: 'Nygren',
    primaryEmail: 'henrik.nygren@helsinki.fi',
    secondaryEmail: 'henrik.nygren@example.com'
  },
  ...overrides
})

// getCourseUnitEnrolments trims by activity period against the clock, so a realisation that
// is meant to survive the trim has to be dated relative to now rather than pinned.
const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const realisation = (id, enrollments, activityPeriod) => ({
  id,
  name: { fi: 'Ohjelmoinnin perusteet' },
  activityPeriod: activityPeriod || { startDate: daysFromNow(-120), endDate: daysFromNow(30) },
  gradeScaleId: 'sis-0-5',
  enrollments
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

const list = (items) => post(PATH, items, { token })

describe('listing the people on a course', () => {
  test('returns everyone Sisu holds an enrolment for', async () => {
    importer.respondWith([realisation('cur-1', [enrolment('012345678', 'cur-1')])])

    const { status, body } = await list([{ requestItemId: 'people-1', courseCode: 'TKT10001' }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'people-1',
        status: 'ok',
        code: 'enrolmentsListed',
        result: {
          people: [
            {
              studentNumber: '012345678',
              personId: 'hy-hlo-012345678',
              firstNames: 'Henrik Admin',
              lastName: 'Nygren',
              primaryEmail: 'henrik.nygren@helsinki.fi',
              secondaryEmail: 'henrik.nygren@example.com',
              enrolment: {
                id: 'hy-opt-enr-012345678',
                courseUnitRealisationId: 'cur-1',
                state: 'ENROLLED',
                enrolmentDateTime: '2026-05-22T10:15:30.000Z'
              }
            }
          ]
        }
      }
    ])
  })

  test('flattens every realisation of the course into one list of people', async () => {
    importer.respondWith([
      realisation('cur-1', [enrolment('000000000', 'cur-1')]),
      realisation('cur-2', [enrolment('111111111', 'cur-2'), enrolment('222222222', 'cur-2')])
    ])

    const { body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.deepEqual(
      body[0].result.people.map(({ studentNumber }) => studentNumber),
      ['000000000', '111111111', '222222222']
    )
  })

  test('asks the importer once for the course code', async () => {
    importer.respondWith([])

    await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.equal(importer.requests.length, 1)
    assert.match(importer.requests[0].url, /^\/suotar\/course-unit-enrolments\/TKT10001/)
  })

  // Unencoded, a code carrying ../ resolves away to another importer endpoint entirely, with
  // the importer token still attached.
  test('keeps the course code inside its own path segment', async () => {
    importer.respondWith([])

    await list([{ requestItemId: 'a', courseCode: '../responsibles/TKT10001' }])

    assert.equal(importer.requests[0].url, '/suotar/course-unit-enrolments/..%2Fresponsibles%2FTKT10001')
  })

  test('drops realisations whose activity period ended over two months ago', async () => {
    importer.respondWith([
      realisation('cur-current', [enrolment('000000000', 'cur-current')]),
      realisation('cur-old', [enrolment('111111111', 'cur-old')], {
        startDate: daysFromNow(-400),
        endDate: daysFromNow(-200)
      })
    ])

    const { body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.deepEqual(
      body[0].result.people.map(({ studentNumber }) => studentNumber),
      ['000000000'],
      'account linking wants the people enrolled now, not everyone the course ever had'
    )
  })

  test('passes on nothing the spec does not name', async () => {
    importer.respondWith([realisation('cur-1', [enrolment('012345678', 'cur-1')])])

    const { body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])
    const [person] = body[0].result.people

    assert.deepEqual(Object.keys(person).sort(), [
      'enrolment',
      'firstNames',
      'lastName',
      'personId',
      'primaryEmail',
      'secondaryEmail',
      'studentNumber'
    ])
    assert.deepEqual(Object.keys(person.enrolment).sort(), [
      'courseUnitRealisationId',
      'enrolmentDateTime',
      'id',
      'state'
    ])
  })
})

describe('the realisation filter the spec asks for', () => {
  test('refuses an item naming a realisation rather than ignoring the field', async () => {
    importer.respondWith([realisation('cur-1', [enrolment('000000000', 'cur-1')])])

    const { status, body } = await list([
      { requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: 'cur-1' }
    ])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /courseUnitRealisationId/)
    assert.equal(importer.requests.length, 0, 'a refused batch must not reach the importer')
  })

  test('refuses a null realisation id too, so the field cannot be sent at all', async () => {
    const { status, body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: null }])

    assert.equal(status, 400)
    assert.match(body.error.message, /courseUnitRealisationId/)
  })

  test('names the realisation of each person so the caller can filter for itself', async () => {
    importer.respondWith([
      realisation('cur-1', [enrolment('000000000', 'cur-1')]),
      realisation('cur-2', [enrolment('111111111', 'cur-2')])
    ])

    const { body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.deepEqual(
      body[0].result.people.map(({ enrolment: e }) => e.courseUnitRealisationId),
      ['cur-1', 'cur-2']
    )
  })
})

describe('batching', () => {
  test('asks the importer once per distinct course code', async () => {
    importer.respondByPath({
      '/suotar/course-unit-enrolments/TKT10001': [realisation('cur-1', [enrolment('000000000', 'cur-1')])],
      '/suotar/course-unit-enrolments/TKT10002': [realisation('cur-2', [enrolment('111111111', 'cur-2')])]
    })

    const { body } = await list([
      { requestItemId: 'a', courseCode: 'TKT10001' },
      { requestItemId: 'b', courseCode: 'TKT10001' },
      { requestItemId: 'c', courseCode: 'TKT10002' }
    ])

    assert.equal(importer.requests.length, 2, 'two items share a course code and must share its lookup')
    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['a', 'enrolmentsListed'],
        ['b', 'enrolmentsListed'],
        ['c', 'enrolmentsListed']
      ]
    )
  })

  test('refuses a batch over the lower ceiling this endpoint asks for', async () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ requestItemId: `a${i}`, courseCode: `TKT1000${i}` }))

    const { status, body } = await list(items)

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /at most 50/)
    assert.equal(importer.requests.length, 0, 'a refused batch must not reach the importer')
  })

  test('answers a mixed batch in request order', async () => {
    importer.respondByPath({
      '/suotar/course-unit-enrolments/TKT10001': [realisation('cur-1', [enrolment('000000000', 'cur-1')])],
      '/suotar/course-unit-enrolments/UNKNOWN': []
    })

    const { body } = await list([
      { requestItemId: 'a', courseCode: 'UNKNOWN' },
      { requestItemId: 'b', courseCode: 'TKT10001' }
    ])

    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['a', 'courseCodeNotFound'],
        ['b', 'enrolmentsListed']
      ]
    )
  })
})

describe('when Sisu does not answer', () => {
  test('returns courseCodeNotFound when the code resolves to no realisation', async () => {
    importer.respondWith([])

    const { status, body } = await list([{ requestItemId: 'a', courseCode: 'NOPE' }])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'a',
        status: 'error',
        code: 'courseCodeNotFound',
        error: { message: 'Course code could not be resolved in Sisu.' }
      }
    ])
  })

  test('fails only the items whose course code failed', async () => {
    importer.handle = (req, res) => {
      if (req.url.includes('BROKEN')) {
        res.writeHead(500)
        return res.end('{}')
      }
      return res.end(JSON.stringify([realisation('cur-1', [enrolment('000000000', 'cur-1')])]))
    }

    const { status, body } = await list([
      { requestItemId: 'a', courseCode: 'BROKEN' },
      { requestItemId: 'b', courseCode: 'TKT10001' }
    ])

    assert.equal(status, 503, 'one course code the importer cannot answer sinks the whole request')
    assert.deepEqual(body, {
      error: { code: 'serviceTemporarilyUnavailable', message: 'Failed to fetch Sisu data.' }
    })
  })

  test('fails the request when the importer drops the connection', async () => {
    importer.handle = (req) => req.socket.destroy()

    const { status, body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.equal(status, 503)
    assert.equal(body.error.code, 'serviceTemporarilyUnavailable')
  })
})

describe('request-level validation', () => {
  test('rejects an item with no course code', async () => {
    const { status, body } = await list([{ requestItemId: 'a' }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.equal(importer.requests.length, 0, 'a malformed batch must not reach the importer')
  })

  test('rejects an empty courseUnitRealisationId rather than treating it as absent', async () => {
    const { status, body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: '' }])

    assert.equal(status, 400)
    assert.match(body.error.message, /courseUnitRealisationId/)
  })

  test('rejects a realisation id on one item of an otherwise valid batch', async () => {
    const { status } = await list([
      { requestItemId: 'a', courseCode: 'TKT10001' },
      { requestItemId: 'b', courseCode: 'TKT10002', courseUnitRealisationId: 'cur-1' }
    ])

    assert.equal(status, 400)
  })
})
