/**
 * Spec section 3 up to the Sisu send: the outcome each item resolves to, and the rows
 * written for the ones that survive.
 */
const { test, before, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const {
  connectDatabase,
  disconnectDatabase,
  truncateDatabase,
  importer,
  startImporter,
  stopImporter
} = require('../test/helpers')

const { processMoocfiImport } = require('./processMoocfiImport')
const db = require('../models/index')

const STUDENT_NUMBER = '012345678'
const PERSON_ID = 'hy-hlo-1'
const CODE = 'TKT10001'
const EMPLOYEE_ID = '9111111'
const NAMED_ENROLMENT = 'otm-enrolment-open'
const OTHER_ENROLMENT = 'otm-enrolment-degree'

const GRADES = {
  'sis-0-5': [0, 1, 2, 3, 4, 5].map((n) => ({
    localId: String(n),
    passed: n > 0,
    numericCorrespondence: n,
    abbreviation: { fi: String(n), en: String(n) },
    name: { fi: String(n), en: String(n) }
  })),
  'sis-hyl-hyv': [
    {
      localId: '0',
      passed: false,
      numericCorrespondence: null,
      abbreviation: { fi: 'Hyl.', en: 'Fail' },
      name: { fi: 'Hylätty', en: 'Fail' }
    },
    {
      localId: '1',
      passed: true,
      numericCorrespondence: null,
      abbreviation: { fi: 'Hyv.', en: 'Pass' },
      name: { fi: 'Hyväksytty', en: 'Pass' }
    }
  ]
}

const person = () => ({
  id: PERSON_ID,
  studentNumber: STUDENT_NUMBER,
  firstNames: 'Henrik Admin',
  lastName: 'Nygren',
  primaryEmail: 'henrik@helsinki.fi'
})

/**
 * The named enrolment's realisation ended long ago, the other one is current. That is what
 * makes honouring `enrolmentId` visible: processEntries' date heuristic prefers the
 * realisation closest to the attainment date, which here is the other one.
 */
const enrolment = (id, activityPeriod, overrides = {}) => ({
  id,
  personId: PERSON_ID,
  studyRightId: `sr-${id}`,
  courseUnitId: 'hy-CU-1',
  assessmentItemId: `hy-AI-${id}`,
  courseUnitRealisationId: `cur-${id}`,
  enrolmentDateTime: '2026-01-10T09:00:00.000Z',
  state: 'ENROLLED',
  assessmentItem: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5' },
  courseUnitRealisation: {
    name: { fi: 'Johdatus', en: 'Introduction' },
    activityPeriod
  },
  courseUnit: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5', code: CODE },
  ...overrides
})

// The same enrolments on Sisu's pass/fail scale rather than 0-5.
const passFailEnrolments = () =>
  bothEnrolments().map((e) => ({
    ...e,
    assessmentItem: { ...e.assessmentItem, gradeScaleId: 'sis-hyl-hyv' },
    courseUnit: { ...e.courseUnit, gradeScaleId: 'sis-hyl-hyv' }
  }))

const bothEnrolments = () => [
  enrolment(NAMED_ENROLMENT, { startDate: '2024-01-01', endDate: '2024-05-31' }),
  enrolment(OTHER_ENROLMENT, { startDate: '2026-01-01', endDate: '2026-12-31' })
]

const studyRights = () =>
  [NAMED_ENROLMENT, OTHER_ENROLMENT].map((id) => ({
    id: `sr-${id}`,
    personId: PERSON_ID,
    valid: { startDate: '2020-08-01', endDate: '2030-07-31' },
    grantDate: '2020-08-01'
  }))

const fixtures = ({ persons = [person()], enrolments, attainments = [], rights } = {}) => ({
  '/students': persons,
  '/employees/': [{ id: 'hy-hlo-verifier', employeeNumber: EMPLOYEE_ID }],
  '/grades': GRADES,
  '/suotar/enrolments': [{ personId: PERSON_ID, code: CODE, enrolments: enrolments ?? bothEnrolments() }],
  '/suotar/study-rights-by-person': [],
  '/suotar/study-rights': rights ?? studyRights(),
  '/suotar/attainments': [{ studentNumber: STUDENT_NUMBER, courseCode: CODE, attainments }]
})

const item = (overrides = {}) => ({
  requestItemId: 'moocfi-completion-1',
  studentNumber: STUDENT_NUMBER,
  courseCode: CODE,
  enrolmentId: NAMED_ENROLMENT,
  attainmentDate: '2026-05-22',
  attainmentLanguage: 'fi',
  gradeScaleId: 'sis-0-5',
  gradeId: '3',
  credits: 5,
  ...overrides
})

// A course with one grader, which is what makes an acceptor resolvable.
const seedCourse = async ({ withGrader = true, courseCode = CODE } = {}) => {
  const course = await db.courses.create({ name: 'Intro', courseCode, language: 'fi', credits: '5' })
  if (withGrader) {
    const [grader] = await db.users.findOrCreate({
      where: { uid: 'grader' },
      defaults: { name: 'Grader', employeeId: EMPLOYEE_ID, email: 'grader@helsinki.fi', isGrader: true }
    })
    await course.setGraders([grader])
  }
  return course
}

before(async () => {
  await connectDatabase()
  await startImporter()
})

after(async () => {
  await stopImporter()
  await disconnectDatabase()
})

beforeEach(async () => {
  await truncateDatabase()
  importer.reset()
})

const run = (items) => processMoocfiImport(items)

// The two halves of the return, keyed by request item, so a test can assert on either.
const codeOf = ({ results, toSend }, requestItemId) =>
  results.find((r) => r.requestItemId === requestItemId)?.code ??
  (toSend.some((s) => s.requestItemId === requestItemId) ? 'toSend' : undefined)

describe('an item that resolves', () => {
  test('writes a raw entry and an entry, and reports the entry id', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const { results, toSend } = await run([item()])

    assert.deepEqual(results, [], 'a resolvable item is not answered yet; it is queued for the send')
    assert.equal(toSend.length, 1)
    assert.equal(toSend[0].requestItemId, 'moocfi-completion-1')
    assert.match(toSend[0].entry.id, /^hy-kur-/)

    const entries = await db.entries.findAll()
    const rawEntries = await db.raw_entries.findAll()
    assert.equal(entries.length, 1)
    assert.equal(rawEntries.length, 1)
    assert.equal(entries[0].rawEntryId, rawEntries[0].id)
    assert.equal(rawEntries[0].moocfiRequestItemId, 'moocfi-completion-1')
  })

  test('registers against the enrolment the caller named, not the one the date matches', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    await run([item()])

    const [entry] = await db.entries.findAll()
    assert.equal(
      entry.courseUnitRealisationId,
      `cur-${NAMED_ENROLMENT}`,
      "the attainment date falls in the other realisation's activity period, so a date heuristic would pick that one"
    )
    assert.equal(entry.assessmentItemId, `hy-AI-${NAMED_ENROLMENT}`)
  })

  test('converts the grade id to the grade Sisu expects on the enrolment scale', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    await run([item({ gradeId: '4' })])

    const [entry] = await db.entries.findAll()
    const [rawEntry] = await db.raw_entries.findAll()
    assert.equal(entry.gradeId, '4')
    assert.equal(entry.gradeScaleId, 'sis-0-5')
    assert.equal(rawEntry.grade, '4', 'the raw entry keeps the Finnish grade string the rest of Suotar reads')
  })

  test('resolves the acceptor from the course grader', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    await run([item()])

    const [entry] = await db.entries.findAll()
    assert.equal(entry.verifierPersonId, 'hy-hlo-verifier')
  })

  test('picks the lowest-id grader when the course has several', async () => {
    const course = await seedCourse()
    const second = await db.users.create({
      name: 'Later Grader',
      employeeId: '9222222',
      uid: 'grader-2',
      email: 'grader2@helsinki.fi',
      isGrader: true
    })
    await course.addGrader(second)
    importer.respondByPath({
      ...fixtures(),
      '/employees/': (req) =>
        req.url.endsWith(EMPLOYEE_ID)
          ? [{ id: 'hy-hlo-verifier', employeeNumber: EMPLOYEE_ID }]
          : [{ id: 'hy-hlo-second', employeeNumber: '9222222' }]
    })

    await run([item()])

    const [entry] = await db.entries.findAll()
    assert.equal(entry.verifierPersonId, 'hy-hlo-verifier', 'the grader seeded first has the lower id')
    assert.equal(
      importer.requests.filter(({ url }) => url.startsWith('/employees/')).length,
      1,
      'only the chosen grader is looked up'
    )
  })

  // Both directions of the pass/fail scale: mapGrades resolves each to its own Finnish string.
  for (const [gradeId, abbreviation] of [
    ['1', 'Hyv.'],
    ['0', 'Hyl.']
  ]) {
    test(`registers ${abbreviation} on a pass/fail enrolment`, async () => {
      await seedCourse()
      importer.respondByPath(fixtures({ enrolments: passFailEnrolments() }))

      const { toSend } = await run([item({ gradeScaleId: 'sis-hyl-hyv', gradeId })])

      assert.equal(toSend.length, 1)
      const [entry] = await db.entries.findAll()
      const [rawEntry] = await db.raw_entries.findAll()
      assert.equal(entry.gradeScaleId, 'sis-hyl-hyv')
      assert.equal(entry.gradeId, gradeId)
      assert.equal(rawEntry.grade, abbreviation)
    })
  }

  /**
   * Sisu refuses an attainment dated outside the study right, so getDateWithinStudyright moves
   * it. The deviations doc records this: mooc.fi may not get the date it asked for.
   */
  test('moves an attainment date that falls after the study right ends', async () => {
    await seedCourse()
    importer.respondByPath(
      fixtures({
        rights: [
          {
            id: `sr-${NAMED_ENROLMENT}`,
            personId: PERSON_ID,
            valid: { startDate: '2020-08-01', endDate: '2026-05-01' },
            grantDate: '2020-08-01'
          }
        ]
      })
    )

    await run([item({ attainmentDate: '2026-05-22' })])

    const [entry] = await db.entries.findAll()
    assert.equal(
      entry.completionDate.toISOString().slice(0, 10),
      '2026-04-30',
      'the day before the study right ended, not the 2026-05-22 that was asked for'
    )
  })
})

describe('items that cannot be registered', () => {
  test('courseNotAllowed when Suotar does not carry the course code', async () => {
    importer.respondByPath(fixtures())

    const outcome = await run([item()])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'courseNotAllowed')
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('courseNotAllowed for Elements of AI and Building AI, which are not settled yet', async () => {
    const codes = ['TKT21018', 'TKT210281', 'AYTKT21018sv']
    await seedCourse()
    // Seeded like any other course, so the block is what refuses them and not their absence.
    for (const courseCode of codes) await seedCourse({ courseCode })
    importer.respondByPath(fixtures())

    const { results } = await run(codes.map((courseCode, i) => item({ requestItemId: `c${i}`, courseCode })))

    assert.deepEqual(
      results.map(({ code }) => code),
      ['courseNotAllowed', 'courseNotAllowed', 'courseNotAllowed']
    )
    for (const { error } of results) assert.match(error.message, /cannot be registered through this API yet/)
  })

  test('acceptorNotFound when the course has no grader', async () => {
    await seedCourse({ withGrader: false })
    importer.respondByPath(fixtures())

    const outcome = await run([item()])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'acceptorNotFound')
  })

  test('acceptorNotFound when Sisu does not know the grader, without blaming an outage', async () => {
    await seedCourse()
    importer.respondByPath({ ...fixtures(), '/employees/': [] })

    const { results } = await run([item()])

    assert.equal(results[0].code, 'acceptorNotFound')
  })

  test('personNotFound when Sisu has no such student number', async () => {
    await seedCourse()
    importer.respondByPath(fixtures({ persons: [] }))

    const outcome = await run([item()])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'personNotFound')
  })

  test("enrolmentNotFound when the named enrolment is not among the student's", async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const outcome = await run([item({ enrolmentId: 'otm-enrolment-nobody-has' })])

    assert.equal(
      codeOf(outcome, 'moocfi-completion-1'),
      'enrolmentNotFound',
      'other enrolments exist, so this must not silently fall back to one of them'
    )
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('enrolmentNotFound when the named enrolment is not in state ENROLLED', async () => {
    await seedCourse()
    const enrolments = bothEnrolments().map((e) => (e.id === NAMED_ENROLMENT ? { ...e, state: 'NOT_ENROLLED' } : e))
    importer.respondByPath(fixtures({ enrolments }))

    const outcome = await run([item()])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'enrolmentNotFound')
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('invalidCredits when the credit amount is outside the course unit range', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const outcome = await run([item({ credits: 10 })])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'invalidCredits')
  })

  test('invalidCredits when Sisu gives the course unit no credit range', async () => {
    await seedCourse()
    const enrolments = bothEnrolments().map((e) => ({ ...e, courseUnit: { ...e.courseUnit, credits: null } }))
    importer.respondByPath(fixtures({ enrolments }))

    const outcome = await run([item()])

    assert.equal(
      codeOf(outcome, 'moocfi-completion-1'),
      'invalidCredits',
      "a missing credit range is one item's problem, not a reason to fail the request"
    )
  })

  test('invalidGradeForGradeScale for a grade id the scale does not have', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const outcome = await run([item({ gradeId: '9' })])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'invalidGradeForGradeScale')
  })

  test('invalidGradeForGradeScale when the grade is valid on the scale the caller sent but not on the enrolment scale', async () => {
    await seedCourse()

    // '5' exists on sis-0-5 but the enrolment here is graded pass/fail.
    importer.respondByPath(fixtures({ enrolments: passFailEnrolments() }))

    const outcome = await run([item({ gradeScaleId: 'sis-0-5', gradeId: '5' })])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'invalidGradeForGradeScale')
  })

  test('studyRightNotValid when no study right can carry the attainment', async () => {
    await seedCourse()
    importer.respondByPath(fixtures({ rights: [] }))

    const outcome = await run([item()])

    assert.equal(codeOf(outcome, 'moocfi-completion-1'), 'studyRightNotValid')
    assert.equal((await db.entries.findAll()).length, 0)
  })
})

describe('attainments Sisu already holds', () => {
  const earlier = (overrides = {}) => ({
    id: 'otm-existing-1',
    type: 'CourseUnitAttainment',
    state: 'ATTAINED',
    attainmentDate: '2026-05-22',
    registrationDate: '2026-05-22',
    gradeScaleId: 'sis-0-5',
    gradeId: '3',
    credits: 5,
    misregistration: false,
    grade: { passed: true, numericCorrespondence: 3, name: { en: '3' } },
    ...overrides
  })

  test('duplicateAttainment is a success carrying the existing attainment', async () => {
    await seedCourse()
    importer.respondByPath(fixtures({ attainments: [earlier()] }))

    const { results } = await run([item()])

    assert.equal(results[0].status, 'ok')
    assert.equal(results[0].code, 'duplicateAttainment')
    assert.equal(results[0].result.attainment.id, 'otm-existing-1')
    assert.equal((await db.entries.findAll()).length, 0, 'a duplicate must not create a second entry')
  })

  test('notImprovedAttainment when a better attainment already exists', async () => {
    await seedCourse()
    importer.respondByPath(
      fixtures({
        attainments: [
          earlier({
            gradeId: '5',
            attainmentDate: '2026-03-01',
            grade: { passed: true, numericCorrespondence: 5, name: { en: '5' } }
          })
        ]
      })
    )

    const { results } = await run([item({ gradeId: '3' })])

    assert.equal(results[0].status, 'ok')
    assert.equal(results[0].code, 'notImprovedAttainment')
    assert.equal(results[0].result.previousAttainment.gradeId, '5')
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('a better grade than the existing one is registered', async () => {
    await seedCourse()
    importer.respondByPath(
      fixtures({
        attainments: [
          earlier({
            gradeId: '2',
            attainmentDate: '2026-03-01',
            grade: { passed: true, numericCorrespondence: 2, name: { en: '2' } }
          })
        ]
      })
    )

    const { results, toSend } = await run([item({ gradeId: '4' })])

    assert.deepEqual(results, [])
    assert.equal(toSend.length, 1)
    assert.equal((await db.entries.findAll()).length, 1)
  })

  test('a better grade on another course in the same batch does not block a registration', async () => {
    const OTHER_CODE = 'TKT10002'
    const OTHER_ENROLMENT_ID = 'otm-enrolment-other'
    await seedCourse()
    const otherCourse = await db.courses.create({
      name: 'Toinen',
      courseCode: OTHER_CODE,
      language: 'fi',
      credits: '5'
    })
    await otherCourse.setGraders(await db.users.findAll())

    const otherEnrolment = enrolment(
      OTHER_ENROLMENT_ID,
      { startDate: '2026-01-01', endDate: '2026-12-31' },
      { courseUnit: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5', code: OTHER_CODE } }
    )
    const excellent = earlier({
      id: 'otm-existing-other',
      gradeId: '5',
      attainmentDate: '2026-03-01',
      grade: { passed: true, numericCorrespondence: 5, name: { en: '5' } }
    })

    importer.respondByPath({
      ...fixtures({
        rights: [
          ...studyRights(),
          {
            id: `sr-${OTHER_ENROLMENT_ID}`,
            personId: PERSON_ID,
            valid: { startDate: '2020-08-01', endDate: '2030-07-31' },
            grantDate: '2020-08-01'
          }
        ]
      }),
      '/suotar/enrolments': [
        { personId: PERSON_ID, code: OTHER_CODE, enrolments: [otherEnrolment] },
        { personId: PERSON_ID, code: CODE, enrolments: bothEnrolments() }
      ],
      // The other course first, which is the row isImprovedGrade would find by student number.
      '/suotar/attainments': [
        { studentNumber: STUDENT_NUMBER, courseCode: OTHER_CODE, attainments: [excellent] },
        { studentNumber: STUDENT_NUMBER, courseCode: CODE, attainments: [] }
      ]
    })

    const outcome = await run([
      item({ requestItemId: 'other-course', courseCode: OTHER_CODE, enrolmentId: OTHER_ENROLMENT_ID, gradeId: '5' }),
      item({ requestItemId: 'this-course', gradeId: '3' })
    ])

    assert.equal(
      codeOf(outcome, 'this-course'),
      'toSend',
      'the student has nothing on this course; the grade 5 belongs to a different one'
    )
  })
})

describe('batching', () => {
  test('one failing item does not cost the others their entry', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const outcome = await run([
      item({ requestItemId: 'a', credits: 10 }),
      item({ requestItemId: 'b' }),
      item({ requestItemId: 'c', courseCode: 'UNKNOWN' })
    ])

    assert.deepEqual(
      ['a', 'b', 'c'].map((id) => [id, codeOf(outcome, id)]),
      [
        ['a', 'invalidCredits'],
        ['b', 'toSend'],
        ['c', 'courseNotAllowed']
      ]
    )
    assert.equal((await db.entries.findAll()).length, 1)
  })

  test('returns both halves in request order', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const { results, toSend } = await run([
      item({ requestItemId: 'a', courseCode: 'UNKNOWN' }),
      item({ requestItemId: 'b' }),
      item({ requestItemId: 'c', courseCode: 'UNKNOWN' }),
      item({ requestItemId: 'd', studentNumber: '111111111' })
    ])

    assert.deepEqual(
      results.map(({ requestItemId }) => requestItemId),
      ['a', 'c', 'd']
    )
    assert.deepEqual(
      toSend.map(({ requestItemId }) => requestItemId),
      ['b']
    )
  })
})

describe('when the acceptor lookup cannot reach Sisu', () => {
  const employeesFail = () => importer.respondByPath(fixtures(), (url) => url.startsWith('/employees/'))

  /**
   * Section 3 has no per-item code for an unreachable importer, and nothing is written before
   * the lookups finish, so the whole request fails and a retry starts from clean.
   */
  test('fails the request rather than answering per item', async () => {
    await seedCourse()
    employeesFail()

    await assert.rejects(() => run([item()]), /500/)
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('still reports acceptorNotFound when the course simply has no grader', async () => {
    await seedCourse({ withGrader: false })
    employeesFail()

    const outcome = await run([item()])

    assert.equal(
      codeOf(outcome, 'moocfi-completion-1'),
      'acceptorNotFound',
      'with no grader configured there is nothing to look up, so the outage is irrelevant'
    )
  })
})

describe('when resolving fails partway through the batch', () => {
  /**
   * `getDateWithinStudyright` falls back to a per-person importer call when the enrolment's
   * own study right did not come back. Here the first item resolves cleanly and the second
   * one hits that fallback and dies, so the first is what must not be left written.
   */
  test('writes nothing at all', async () => {
    await seedCourse()
    const routes = fixtures({
      rights: [
        {
          id: `sr-${NAMED_ENROLMENT}`,
          personId: PERSON_ID,
          valid: { startDate: '2020-08-01', endDate: '2030-07-31' },
          grantDate: '2020-08-01'
        }
      ]
    })
    importer.respondByPath(routes, (url) => url.startsWith('/suotar/study-rights-by-person'))

    await assert.rejects(
      () => run([item({ requestItemId: 'a' }), item({ requestItemId: 'b', enrolmentId: OTHER_ENROLMENT })]),
      /500/
    )

    assert.equal((await db.entries.findAll()).length, 0, 'the first item must not survive the second one failing')
    assert.equal((await db.raw_entries.findAll()).length, 0)
  })

  // Fails inside the transaction, which is the only path that reaches the rollback.
  test('rolls back rows already written when a later write fails', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const create = db.entries.create.bind(db.entries)
    let calls = 0
    db.entries.create = (...args) => {
      calls += 1
      if (calls === 2) throw new Error('write failed')
      return create(...args)
    }

    try {
      await assert.rejects(() => run([item({ requestItemId: 'a' }), item({ requestItemId: 'b' })]), /write failed/)
    } finally {
      db.entries.create = create
    }

    assert.equal((await db.entries.findAll()).length, 0)
    assert.equal((await db.raw_entries.findAll()).length, 0, "the first item's raw entry must roll back too")
  })

  test('the same item is written when nothing fails', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const { toSend } = await run([item({ requestItemId: 'a' })])

    assert.equal(toSend.length, 1, 'the failure tests only mean something if this item writes on its own')
  })
})

describe('the submission cooldown', () => {
  // Sequelize will not update createdAt through the model, so age the row in SQL.
  const age = (entry, hours) =>
    db.sequelize.query('UPDATE entries SET "createdAt" = :createdAt WHERE id = :id', {
      replacements: { createdAt: new Date(Date.now() - hours * 60 * 60 * 1000), id: entry.id }
    })

  /**
   * Resolving does not send; the controller does. So a row only waits once its state says it
   * reached Sisu, which is what these have to stand in for.
   */
  const submitted = (entry, sendState = 'ATTEMPTED') => entry.update({ sendState })

  test('refuses a resubmission while the first outcome is unknown', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])
    await submitted(first.toSend[0].entry)
    importer.requests = []
    const { results, toSend } = await run([item()])

    assert.deepEqual(toSend, [], 'submitting again could create a second attainment in Sisu')
    assert.equal(results[0].status, 'error')
    assert.equal(results[0].code, 'submissionPending')
    assert.equal((await db.entries.findAll()).length, 1)
    assert.equal(importer.requests.length, 0, 'a refused item needs no importer lookups')
  })

  test('hands back the attainment id so mooc.fi can verify, and when to retry', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])
    await submitted(first.toSend[0].entry)
    const { results } = await run([item()])

    assert.equal(results[0].result.submittedAttainmentId, first.toSend[0].entry.id)
    assert.equal(results[0].result.submittedAttainmentType, 'AssessmentItemAttainment')
    const retryAfter = new Date(results[0].result.retryAfter).getTime()
    const created = first.toSend[0].entry.createdAt.getTime()
    assert.equal(retryAfter - created, 2 * 60 * 60 * 1000)
  })

  /**
   * REJECTED means Sisu evaluated the attainment and refused it, so nothing exists in Sisu and
   * there is nothing a correction could duplicate.
   */
  test('exempts a submission Sisu rejected, so a correction goes through at once', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])
    await first.toSend[0].entry.update({ sendState: 'REJECTED', errors: { credits: ['invalid'] } })

    const { results, toSend } = await run([item({ credits: 5, gradeId: '4' })])

    assert.deepEqual(results, [])
    assert.equal(toSend.length, 1)
    assert.notEqual(toSend[0].entry.id, first.toSend[0].entry.id, 'the correction gets its own attainment')
    assert.equal((await db.entries.findAll()).length, 2)
  })

  test('lets a resubmission through once the cooldown has passed', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])
    await submitted(first.toSend[0].entry)
    await age(first.toSend[0].entry, 3)

    const { results, toSend } = await run([item()])

    assert.deepEqual(results, [], 'by now the importer has synced, so the duplicate check can be trusted')
    assert.equal(toSend.length, 1)
    assert.equal((await db.entries.findAll()).length, 2)
  })

  test('does not wait on a completion that was never sent', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])

    const { results, toSend } = await run([item()])

    assert.deepEqual(results, [], 'the first attempt never left Suotar, so there is nothing to duplicate')
    assert.equal(toSend.length, 1)
    assert.equal(first.toSend[0].entry.sendState, 'NOT_SENT')
  })

  test('refuses only the item on cooldown, not the rest of the batch', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const first = await run([item()])
    await submitted(first.toSend[0].entry)
    const { results, toSend } = await run([item(), item({ requestItemId: 'moocfi-completion-2', gradeId: '4' })])

    assert.deepEqual(
      results.map(({ requestItemId, code }) => [requestItemId, code]),
      [['moocfi-completion-1', 'submissionPending']]
    )
    assert.deepEqual(
      toSend.map(({ requestItemId }) => requestItemId),
      ['moocfi-completion-2']
    )
  })
})
