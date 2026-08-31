/**
 * Spec section 2, end to end from the HTTP request to the importer calls it makes.
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

const PATH = '/api/enrolments/resolve'

const PERSON_ID = 'hy-hlo-1'
const STUDENT_NUMBER = '012345678'
const CODE = 'TKT10001'

const person = (studentNumber = STUDENT_NUMBER, id = PERSON_ID) => ({
  id,
  studentNumber,
  firstNames: 'Henrik Admin',
  lastName: 'Nygren',
  dateOfBirth: '1990-01-01T00:00:00.000Z'
})

// An enrolment as /suotar/enrolments returns it: raw columns plus three nested includes.
const enrolment = (overrides = {}) => ({
  id: 'otm-enrolment-1',
  personId: PERSON_ID,
  studyRightId: 'otm-degree-sr-1',
  courseUnitId: 'hy-CU-1',
  assessmentItemId: 'hy-AI-1',
  courseUnitRealisationId: 'hy-opt-cur-degree',
  enrolmentDateTime: '2026-05-20T09:10:00.000Z',
  state: 'ENROLLED',
  assessmentItem: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5' },
  courseUnitRealisation: {
    name: { fi: 'Johdatus', sv: 'Introduktion', en: 'Introduction' },
    activityPeriod: { startDate: '2026-03-01', endDate: '2026-06-30' }
  },
  courseUnit: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5', code: CODE },
  ...overrides
})

const attainment = (overrides = {}) => ({
  id: 'otm-attainment-1',
  type: 'AssessmentItemAttainment',
  state: 'ATTAINED',
  personId: PERSON_ID,
  courseUnitId: 'hy-CU-1',
  assessmentItemId: 'hy-AI-1',
  courseUnitRealisationId: 'hy-opt-cur-degree',
  attainmentDate: '2026-03-01',
  registrationDate: '2026-03-05',
  gradeScaleId: 'sis-0-5',
  gradeId: '3',
  misregistration: false,
  grade: { passed: true, localId: '3' },
  ...overrides
})

// Every call the controller makes, with defaults each test can override one at a time.
const fixtures = ({ persons = [person()], courseUnits, enrolments, studyRights, attainments } = {}) => ({
  '/students': persons,
  '/suotar/course-unit-ids': courseUnits ?? { [CODE]: [{ id: 'hy-CU-1', code: CODE }] },
  '/suotar/enrolments': enrolments ?? [{ personId: PERSON_ID, code: CODE, enrolments: [enrolment()] }],
  '/suotar/study-rights': studyRights ?? [
    { id: 'otm-degree-sr-1', valid: { startDate: '2024-08-01', endDate: '2030-07-31' } }
  ],
  '/suotar/attainments': attainments ?? [{ studentNumber: STUDENT_NUMBER, courseCode: CODE, attainments: [] }]
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
const one = { requestItemId: 'enrolment-1', studentNumber: STUDENT_NUMBER, courseCode: CODE }

describe('resolving an enrolment', () => {
  test('returns every spec field for the enrolment', async () => {
    importer.respondByPath(fixtures())

    const { status, body } = await resolve([one])

    assert.equal(status, 200)
    assert.equal(body[0].code, 'enrolmentFound')
    assert.deepEqual(body[0].result.enrolments, [
      {
        id: 'otm-enrolment-1',
        state: 'ENROLLED',
        kind: 'degree',
        courseUnitId: 'hy-CU-1',
        assessmentItemId: 'hy-AI-1',
        courseUnitRealisationId: 'hy-opt-cur-degree',
        courseUnitRealisationName: { fi: 'Johdatus', sv: 'Introduktion', en: 'Introduction' },
        activityPeriod: { startDate: '2026-03-01', endDate: '2026-06-30' },
        gradeScaleId: 'sis-0-5',
        credits: { min: 5, max: 5 },
        studyRightId: 'otm-degree-sr-1',
        studyRightValidityPeriod: { startDate: '2024-08-01', endDate: '2030-07-31' },
        enrolmentDateTime: '2026-05-20T09:10:00.000Z'
      }
    ])
  })

  test('lists a degree and an open university enrolment side by side', async () => {
    importer.respondByPath(
      fixtures({
        enrolments: [
          {
            personId: PERSON_ID,
            code: CODE,
            enrolments: [
              enrolment(),
              enrolment({
                id: 'otm-enrolment-2',
                studyRightId: 'hy-avoin-ew-sr-C4C04',
                courseUnitRealisationId: 'hy-opt-cur-open'
              })
            ]
          }
        ],
        studyRights: [
          { id: 'otm-degree-sr-1', valid: { startDate: '2024-08-01', endDate: '2030-07-31' } },
          { id: 'hy-avoin-ew-sr-C4C04', valid: { startDate: '2026-01-01', endDate: '2026-12-31' } }
        ]
      })
    )

    const { body } = await resolve([one])

    assert.deepEqual(
      body[0].result.enrolments.map(({ kind, studyRightValidityPeriod }) => [kind, studyRightValidityPeriod.endDate]),
      [
        ['degree', '2030-07-31'],
        ['openUniversity', '2026-12-31']
      ],
      'kind is derived from `avoin` in the study right id, and each enrolment gets its own validity period'
    )
  })

  test('leaves studyRightValidityPeriod undefined when the study right did not come back', async () => {
    importer.respondByPath(fixtures({ studyRights: [] }))

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'enrolmentFound', 'a missing study right must not sink the enrolment')
    assert.equal(body[0].result.enrolments[0].studyRightValidityPeriod, undefined)
  })

  test('falls back to the course unit grade scale when the assessment item has none', async () => {
    importer.respondByPath(
      fixtures({
        enrolments: [
          {
            personId: PERSON_ID,
            code: CODE,
            enrolments: [enrolment({ assessmentItem: { credits: null, gradeScaleId: null } })]
          }
        ]
      })
    )

    const { body } = await resolve([one])

    assert.equal(body[0].result.enrolments[0].gradeScaleId, 'sis-0-5')
    assert.deepEqual(body[0].result.enrolments[0].credits, { min: 5, max: 5 })
  })
})

describe('existing attainments', () => {
  test('reports an attainment Sisu already holds', async () => {
    importer.respondByPath(
      fixtures({ attainments: [{ studentNumber: STUDENT_NUMBER, courseCode: CODE, attainments: [attainment()] }] })
    )

    const { body } = await resolve([one])

    assert.deepEqual(body[0].result.existingAttainments, [
      {
        id: 'otm-attainment-1',
        type: 'AssessmentItemAttainment',
        state: 'ATTAINED',
        personId: PERSON_ID,
        courseUnitId: 'hy-CU-1',
        assessmentItemId: 'hy-AI-1',
        courseUnitRealisationId: 'hy-opt-cur-degree',
        attainmentDate: '2026-03-01',
        registrationDate: '2026-03-05',
        gradeScaleId: 'sis-0-5',
        gradeId: '3',
        passed: true
      }
    ])
  })

  test('is an empty list when Sisu holds none', async () => {
    importer.respondByPath(fixtures())

    const { body } = await resolve([one])

    assert.deepEqual(body[0].result.existingAttainments, [])
  })

  test('asks for attainments on this course code only', async () => {
    importer.respondByPath(fixtures())

    await resolve([one])

    const request = importer.requests.find(({ url }) => url.startsWith('/suotar/attainments'))
    assert.match(
      request.url,
      /noSubstitutions=true/,
      'a substituted course is a different completion; the spec asks about this one'
    )
  })
})

describe('when something does not resolve', () => {
  test('returns personNotFound for an unknown student number', async () => {
    importer.respondByPath(fixtures({ persons: [] }))

    const { status, body } = await resolve([one])

    assert.equal(status, 200)
    assert.deepEqual(body, [
      {
        requestItemId: 'enrolment-1',
        status: 'error',
        code: 'personNotFound',
        error: { message: 'No Sisu person was found for the supplied student number.' }
      }
    ])
  })

  test('returns courseCodeNotFound for a code Sisu does not carry', async () => {
    importer.respondByPath(fixtures({ courseUnits: {} }))

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'courseCodeNotFound')
  })

  test('returns courseCodeNotFound when the code resolves to no course units', async () => {
    importer.respondByPath(fixtures({ courseUnits: { [CODE]: [] } }))

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'courseCodeNotFound')
  })

  test('returns enrolmentNotFound when the person has no enrolment on the course', async () => {
    importer.respondByPath(fixtures({ enrolments: [{ personId: PERSON_ID, code: CODE, enrolments: [] }] }))

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'enrolmentNotFound')
    assert.equal(body[0].error.message, 'No Sisu enrolment was found for this person and course.')
  })

  /**
   * The importer filters on state: 'ENROLLED', so production cannot reach this branch
   * today. The fake does not filter, which is what keeps the code honest until it can.
   */
  test('returns enrolmentNotAccepted when every enrolment is in another state', async () => {
    importer.respondByPath(
      fixtures({
        enrolments: [{ personId: PERSON_ID, code: CODE, enrolments: [enrolment({ state: 'NOT_ENROLLED' })] }]
      })
    )

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'enrolmentNotAccepted')
  })

  test('keeps only the accepted enrolments when states are mixed', async () => {
    importer.respondByPath(
      fixtures({
        enrolments: [
          {
            personId: PERSON_ID,
            code: CODE,
            enrolments: [enrolment({ id: 'rejected', state: 'REJECTED' }), enrolment({ id: 'accepted' })]
          }
        ]
      })
    )

    const { body } = await resolve([one])

    assert.equal(body[0].code, 'enrolmentFound')
    assert.deepEqual(
      body[0].result.enrolments.map(({ id }) => id),
      ['accepted']
    )
  })
})

describe('batching', () => {
  test('answers a mixed batch in request order', async () => {
    importer.respondByPath(
      fixtures({
        persons: [person(), person('111111111', 'hy-hlo-2')],
        enrolments: [
          { personId: PERSON_ID, code: CODE, enrolments: [enrolment()] },
          { personId: 'hy-hlo-2', code: CODE, enrolments: [] }
        ]
      })
    )

    const { body } = await resolve([
      { requestItemId: 'a', studentNumber: '999999999', courseCode: CODE },
      { requestItemId: 'b', studentNumber: '111111111', courseCode: CODE },
      { requestItemId: 'c', studentNumber: STUDENT_NUMBER, courseCode: CODE }
    ])

    assert.deepEqual(
      body.map(({ requestItemId, code }) => [requestItemId, code]),
      [
        ['a', 'personNotFound'],
        ['b', 'enrolmentNotFound'],
        ['c', 'enrolmentFound']
      ]
    )
  })

  test('asks the importer once per distinct person and course pair', async () => {
    importer.respondByPath(fixtures())

    await resolve([
      { requestItemId: 'a', studentNumber: STUDENT_NUMBER, courseCode: CODE },
      { requestItemId: 'b', studentNumber: STUDENT_NUMBER, courseCode: CODE }
    ])

    const enrolmentRequests = importer.requests.filter(({ url }) => url.startsWith('/suotar/enrolments'))
    assert.equal(enrolmentRequests.length, 1)
    assert.deepEqual(enrolmentRequests[0].body, [{ personId: PERSON_ID, code: CODE }])
  })

  test('does not ask about pairs that failed to resolve', async () => {
    importer.respondByPath(fixtures({ persons: [] }))

    await resolve([one])

    assert.equal(
      importer.requests.filter(({ url }) => url.startsWith('/suotar/enrolments')).length,
      0,
      'an unresolved person has no personId to ask about'
    )
  })
})

describe('when the importer fails', () => {
  test('fails every item when a lookup answers 500', async () => {
    importer.handle = (req, res) => {
      if (req.url.startsWith('/suotar/enrolments')) {
        res.writeHead(500)
        return res.end('{}')
      }
      const routes = fixtures()
      const match = Object.keys(routes).find((path) => req.url.startsWith(path))
      return res.end(JSON.stringify(routes[match]))
    }

    const { status, body } = await resolve([
      one,
      { requestItemId: 'enrolment-2', studentNumber: STUDENT_NUMBER, courseCode: CODE }
    ])

    assert.equal(status, 200, 'an importer failure is a per-item outcome, not a request-level error')
    assert.deepEqual(
      body.map(({ code }) => code),
      ['sisuTemporarilyUnavailable', 'sisuTemporarilyUnavailable']
    )
  })

  test('fails every item when the importer drops the connection', async () => {
    importer.handle = (req) => req.socket.destroy()

    const { status, body } = await resolve([one])

    assert.equal(status, 200)
    assert.equal(body[0].code, 'sisuTemporarilyUnavailable')
  })
})

describe('request-level validation', () => {
  test('rejects an item with no student number', async () => {
    const { status, body } = await resolve([{ requestItemId: 'a', courseCode: CODE }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.equal(importer.requests.length, 0, 'a malformed batch must not reach the importer')
  })

  test('rejects an item with no course code', async () => {
    const { status, body } = await resolve([{ requestItemId: 'a', studentNumber: STUDENT_NUMBER }])

    assert.equal(status, 400)
    assert.match(body.error.message, /courseCode/)
  })
})
