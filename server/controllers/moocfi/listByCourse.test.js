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

const PATH = '/api/enrolments/list-by-course'

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

const realisation = (id, enrollments) => ({
  id,
  name: { fi: 'Ohjelmoinnin perusteet' },
  activityPeriod: { startDate: '2026-01-01', endDate: '2026-05-31' },
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

  test('flattens every realisation of the course when no realisation is named', async () => {
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

  test('asks the importer for the whole history, not just the active realisations', async () => {
    importer.respondWith([])

    await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.equal(importer.requests.length, 1)
    assert.match(
      importer.requests[0].url,
      /^\/suotar\/course-unit-enrolments\/TKT10001/,
      'the two-month activityPeriod cutoff in getCourseUnitEnrolments would silently drop realisations'
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

describe('filtering by realisation', () => {
  test('keeps only the enrolments on the named realisation', async () => {
    importer.respondWith([
      realisation('cur-1', [enrolment('000000000', 'cur-1')]),
      realisation('cur-2', [enrolment('111111111', 'cur-2')])
    ])

    const { body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: 'cur-2' }])

    assert.deepEqual(
      body[0].result.people.map(({ studentNumber }) => studentNumber),
      ['111111111']
    )
  })

  test('returns an empty list, not courseCodeNotFound, for a realisation nobody is on', async () => {
    importer.respondWith([realisation('cur-1', [enrolment('000000000', 'cur-1')])])

    const { body } = await list([
      { requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: 'cur-unknown' }
    ])

    assert.equal(body[0].code, 'enrolmentsListed', 'the course code did resolve; only the filter matched nothing')
    assert.deepEqual(body[0].result.people, [])
  })
})

describe('batching', () => {
  test('asks the importer once per distinct course code', async () => {
    importer.respondByPath({
      '/suotar/course-unit-enrolments/TKT10001': [realisation('cur-1', [enrolment('000000000', 'cur-1')])],
      '/suotar/course-unit-enrolments/TKT10002': [realisation('cur-2', [enrolment('111111111', 'cur-2')])]
    })

    const { body } = await list([
      { requestItemId: 'a', courseCode: 'TKT10001', courseUnitRealisationId: 'cur-1' },
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

    assert.equal(status, 200, 'an importer failure is a per-item outcome, not a request-level error')
    assert.deepEqual(body[0], {
      requestItemId: 'a',
      status: 'error',
      code: 'sisuTemporarilyUnavailable',
      error: { message: 'Suotar could not serve the list of enrolled people.' }
    })
    assert.equal(body[1].code, 'enrolmentsListed', 'one bad course code must not sink the rest of the batch')
  })

  test('fails the item when the importer drops the connection', async () => {
    importer.handle = (req) => req.socket.destroy()

    const { status, body } = await list([{ requestItemId: 'a', courseCode: 'TKT10001' }])

    assert.equal(status, 200)
    assert.equal(body[0].code, 'sisuTemporarilyUnavailable')
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
})
