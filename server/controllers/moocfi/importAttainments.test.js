/**
 * Spec section 3, end to end from the HTTP request through the Sisu send.
 *
 * What an item resolves to is covered by processMoocfiImport's own suite. This one covers the
 * send: the result each item ends up with, read from the entry row rather than from what
 * attainmentsToSisu returns.
 */

// Without this the send is a dry run that sleeps three seconds and always succeeds.
process.env.SEND_TO_SISU = 'true'

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

const PATH = '/api/attainments/import'
const SEND_PATH = '/suotar/'

const STUDENT_NUMBER = '012345678'
const OTHER_STUDENT_NUMBER = '111111111'
const PERSON_ID = 'hy-hlo-1'
const OTHER_PERSON_ID = 'hy-hlo-2'
const CODE = 'TKT10001'
const REALISATION_ID = 'cur-1'

const GRADES = {
  'sis-0-5': [0, 1, 2, 3, 4, 5].map((n) => ({
    localId: String(n),
    passed: n > 0,
    numericCorrespondence: n,
    abbreviation: { fi: String(n), en: String(n) },
    name: { fi: String(n), en: String(n) }
  }))
}

const person = (id, studentNumber) => ({
  id,
  studentNumber,
  firstNames: 'Henrik Admin',
  lastName: 'Nygren',
  primaryEmail: `${studentNumber}@helsinki.fi`
})

const enrolment = (personId) => ({
  id: `otm-enrolment-${personId}`,
  personId,
  studyRightId: `sr-${personId}`,
  courseUnitId: 'hy-CU-1',
  assessmentItemId: 'hy-AI-1',
  courseUnitRealisationId: REALISATION_ID,
  state: 'ENROLLED',
  assessmentItem: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5' },
  courseUnitRealisation: {
    name: { fi: 'Johdatus' },
    activityPeriod: { startDate: '2026-01-01', endDate: '2026-12-31' }
  },
  courseUnit: { credits: { min: 5, max: 5 }, gradeScaleId: 'sis-0-5', code: CODE }
})

const studyRight = (personId) => ({
  id: `sr-${personId}`,
  personId,
  valid: { startDate: '2020-08-01', endDate: '2030-07-31' },
  grantDate: '2020-08-01'
})

// As importer-db-api answers it: one entry per realisation asked about, each of the
// realisation's teachers relabelled as an acceptor. Derived from the request, so asking for
// the wrong ids cannot go unnoticed.
const acceptorsFor = (req) =>
  Object.fromEntries(
    (req.parsedBody || []).map((courseUnitRealisationId) => [
      courseUnitRealisationId,
      [{ roleUrn: 'urn:code:attainment-acceptor-type:approved-by', personId: 'hy-hlo-teacher', text: 'Teacher' }]
    ])
  )

const fixtures = () => ({
  '/students': [person(PERSON_ID, STUDENT_NUMBER), person(OTHER_PERSON_ID, OTHER_STUDENT_NUMBER)],
  '/grades': GRADES,
  '/suotar/enrolments': [PERSON_ID, OTHER_PERSON_ID].map((personId) => ({
    personId,
    code: CODE,
    enrolments: [enrolment(personId)]
  })),
  '/suotar/study-rights-by-person': [],
  '/suotar/study-rights': [studyRight(PERSON_ID), studyRight(OTHER_PERSON_ID)],
  '/suotar/attainments': [PERSON_ID, OTHER_PERSON_ID].map((_, i) => ({
    studentNumber: [STUDENT_NUMBER, OTHER_STUDENT_NUMBER][i],
    courseCode: CODE,
    attainments: []
  })),
  '/suotar/acceptors': acceptorsFor,
  // The send itself; Sisu answers with the attainments it stored, which nothing here reads.
  [SEND_PATH]: []
})

const item = (overrides = {}) => ({
  requestItemId: 'moocfi-completion-1',
  studentNumber: STUDENT_NUMBER,
  courseCode: CODE,
  enrolmentId: `otm-enrolment-${PERSON_ID}`,
  attainmentDate: '2026-05-22',
  attainmentLanguage: 'fi',
  gradeScaleId: 'sis-0-5',
  gradeId: '3',
  credits: 5,
  ...overrides
})

const otherStudent = (overrides = {}) =>
  item({
    requestItemId: 'moocfi-completion-2',
    studentNumber: OTHER_STUDENT_NUMBER,
    enrolmentId: `otm-enrolment-${OTHER_PERSON_ID}`,
    ...overrides
  })

const seedCourse = async () =>
  await db.courses.create({ name: 'Intro', courseCode: CODE, language: 'fi', credits: '5' })

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

const importItems = (items) => post(PATH, items, { token })

const sends = () => importer.requests.filter(({ url, method }) => url === SEND_PATH && method === 'POST')

const acceptorLookups = () => importer.requests.filter(({ url }) => url.startsWith('/suotar/acceptors'))

const codeOf = (body, requestItemId) => body.find((r) => r.requestItemId === requestItemId)?.code

/**
 * Sisu names the attainments it refused by id, and the id is chosen during the request, so the
 * rejection has to be built from what was just posted. `nth` selects it out of that payload
 * rather than out of the request, because the two are not in the same order.
 */
const refuseAttainment = (nth = 0) => {
  let posts = 0
  return (url) => {
    if (url !== SEND_PATH) return false
    posts += 1
    // Only the first send: the second is attainmentsToSisu retrying what Sisu did not refuse.
    if (posts > 1) return false
    const { id } = importer.requests.at(-1).body[nth]
    return [400, { failingIds: [id], violations: { [id]: ['grade is not valid for the scale'] } }]
  }
}

// A send that never answers, which is the case the caller cannot tell from a success.
const dropTheSend = () => {
  importer.respondByPath(fixtures())
  const respond = importer.handle
  importer.handle = (req, res) => (req.url === SEND_PATH ? req.socket.destroy() : respond(req, res))
}

describe('an attainment Sisu accepts', () => {
  test('answers sent with the attainment id, and records the entry as sent', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const { status, body } = await importItems([item()])

    assert.equal(status, 200)
    assert.deepEqual(
      body.map(({ requestItemId, status: itemStatus, code }) => [requestItemId, itemStatus, code]),
      [['moocfi-completion-1', 'ok', 'sent']]
    )
    assert.match(body[0].result.submittedAttainmentId, /^hy-kur-/)
    assert.equal(body[0].result.submittedAttainmentType, 'AssessmentItemAttainment')

    const [entry] = await db.entries.findAll()
    assert.equal(entry.id, body[0].result.submittedAttainmentId)
    assert.equal(entry.sendState, 'ACCEPTED')
    assert.ok(entry.sent, 'recorded as sent, or the next send would offer it to Sisu again')
    assert.equal(entry.errors, null)
  })

  /**
   * The acceptors are resolved before anything is written, so the send has nothing left it can
   * fail at before it posts. Two lookups would mean it is still fetching its own.
   */
  test('looks the acceptors up once, before the send', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    await importItems([item()])

    assert.equal(acceptorLookups().length, 1)
    assert.deepEqual(acceptorLookups()[0].body, [REALISATION_ID], 'asked about the realisation being registered')

    const [attainment] = sends()[0].body
    assert.deepEqual(
      attainment.acceptorPersons,
      acceptorsFor({ parsedBody: [REALISATION_ID] })[REALISATION_ID],
      'what the importer answered reaches Sisu untouched, keyed by realisation'
    )
  })

  test('posts the attainment Sisu expects, once', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    await importItems([item()])

    assert.equal(sends().length, 1)
    const [attainment] = sends()[0].body
    assert.equal(attainment.personId, PERSON_ID)
    assert.equal(attainment.courseUnitRealisationId, REALISATION_ID)
    assert.equal(attainment.assessmentItemId, 'hy-AI-1')
    assert.equal(attainment.gradeScaleId, 'sis-0-5')
    assert.equal(attainment.gradeId, '3')
    assert.equal(attainment.state, 'ATTAINED')
    assert.equal(attainment.credits, 5)
  })
})

describe('an attainment Sisu refuses', () => {
  test('answers sisuValidationFailed with what Sisu objected to', async () => {
    await seedCourse()
    importer.respondByPath(fixtures(), refuseAttainment())

    const { body } = await importItems([item()])

    assert.equal(body[0].status, 'error')
    assert.equal(body[0].code, 'sisuValidationFailed')
    assert.match(body[0].error.message, /grade is not valid for the scale/)

    const [entry] = await db.entries.findAll()
    assert.equal(entry.sendState, 'REJECTED', 'or the cooldown cannot exempt a corrected retry')
    assert.ok(entry.errors, 'what Sisu objected to belongs on the entry too')
  })

  /**
   * attainmentsToSisu answers 400 for the batch here even though its second send got the other
   * attainment through, which is why the outcome is read from the entry rows instead.
   */
  test('the attainments Sisu did not refuse are still sent', async () => {
    await seedCourse()
    importer.respondByPath(fixtures(), refuseAttainment())

    const { body } = await importItems([item(), otherStudent()])

    assert.equal(sends().length, 2, 'the second send is the retry of what was not refused')
    assert.deepEqual(body.map(({ code }) => code).sort(), ['sent', 'sisuValidationFailed'])
    assert.equal((await db.entries.findAll({ where: { errors: null } })).length, 1)
  })
})

describe('when Sisu does not answer', () => {
  test('answers sisuTimeout carrying the id, so the caller can verify it', async () => {
    await seedCourse()
    dropTheSend()

    const { status, body } = await importItems([item()])

    assert.equal(status, 200, 'an uncertain outcome is still a per-item answer, not a failed request')
    assert.equal(body[0].code, 'sisuTimeout')
    assert.match(body[0].result.submittedAttainmentId, /^hy-kur-/)
    assert.equal(body[0].result.submittedAttainmentType, 'AssessmentItemAttainment')

    const [entry] = await db.entries.findAll()
    assert.equal(entry.id, body[0].result.submittedAttainmentId)
    assert.equal(
      entry.sendState,
      'ATTEMPTED',
      'written before the request left, so an answer that never comes is not read as never sent'
    )
    assert.equal(entry.sent, null, 'nothing may claim this reached Sisu')
  })

  test('the entry stays on cooldown, so an immediate retry is refused rather than resent', async () => {
    await seedCourse()
    dropTheSend()
    const { body: first } = await importItems([item()])
    const sendsBefore = sends().length

    importer.respondByPath(fixtures())
    const { body } = await importItems([item()])

    assert.equal(body[0].code, 'submissionPending')
    assert.equal(body[0].result.submittedAttainmentId, first[0].result.submittedAttainmentId)
    assert.equal(sends().length, sendsBefore, 'no second attainment may reach Sisu while the first is unresolved')
  })
})

describe('items that never reach Sisu', () => {
  test('are answered without a send, alongside the ones that do', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())

    const { body } = await importItems([
      item({ requestItemId: 'a', courseCode: 'UNKNOWN' }),
      otherStudent({ requestItemId: 'b' })
    ])

    assert.deepEqual(
      body.map(({ requestItemId }) => requestItemId),
      ['a', 'b'],
      'one result per request item, in request order'
    )
    assert.equal(codeOf(body, 'a'), 'courseNotAllowed')
    assert.equal(codeOf(body, 'b'), 'sent')
    assert.equal(sends()[0].body.length, 1, 'only the item that resolved is offered to Sisu')
  })

  test('a batch where nothing resolves touches Sisu at all', async () => {
    importer.respondByPath(fixtures())

    const { body } = await importItems([item({ courseCode: 'UNKNOWN' })])

    assert.equal(body[0].code, 'courseNotAllowed')
    assert.equal(sends().length, 0)
  })
})

describe('when the importer cannot answer', () => {
  test('the request fails, with nothing sent and nothing written', async () => {
    await seedCourse()
    importer.respondByPath(fixtures(), (url) => url.startsWith('/suotar/acceptors'))

    const { status, body } = await importItems([item(), otherStudent()])

    assert.equal(status, 500)
    assert.equal(body.error.code, 'internalError')
    assert.equal(sends().length, 0)
    assert.equal((await db.entries.findAll()).length, 0)
  })

  test('an immediate retry is accepted, because nothing was submitted', async () => {
    await seedCourse()
    importer.respondByPath(fixtures(), (url) => url.startsWith('/suotar/acceptors'))
    await importItems([item()])

    importer.respondByPath(fixtures())
    const { body } = await importItems([item()])

    assert.equal(body[0].code, 'sent', 'no cooldown may follow a completion that never left Suotar')
  })
})

describe('the entry state', () => {
  /**
   * The one distinction the old `sent`-plus-`errors` pair could not make: an attainment that
   * was offered to Sisu with no answer, against one that never left. Resending the first risks
   * a duplicate; resending the second is free.
   */
  test('separates never sent from attempted with no answer', async () => {
    await seedCourse()
    importer.respondByPath(fixtures())
    await importItems([item({ requestItemId: 'accepted' })])

    dropTheSend()
    await importItems([otherStudent({ requestItemId: 'attempted' })])

    const states = await db.raw_entries.findAll({ include: [{ association: 'entry' }] })
    assert.deepEqual(states.map(({ moocfiRequestItemId, entry }) => [moocfiRequestItemId, entry.sendState]).sort(), [
      ['accepted', 'ACCEPTED'],
      ['attempted', 'ATTEMPTED']
    ])
  })
})

describe('the request itself', () => {
  test('malformedRequest for an item missing a field the endpoint needs', async () => {
    const { status, body } = await importItems([{ requestItemId: 'a', studentNumber: STUDENT_NUMBER }])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.equal((await db.entries.findAll()).length, 0)
  })

  // The spec quotes every gradeId, and Sisu's own grade ids are strings.
  test('malformedRequest for a gradeId sent as a number', async () => {
    const { status, body } = await importItems([item({ gradeId: 3 })])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /gradeId must be a non-empty string/)
  })

  test('malformedRequest for credits that are not a number', async () => {
    const { status, body } = await importItems([item({ credits: '5' })])

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /credits/)
  })

  test('refuses a batch over the lower ceiling this endpoint asks for', async () => {
    const items = Array.from({ length: 101 }, (_, i) => item({ requestItemId: `a${i}` }))

    const { status, body } = await importItems(items)

    assert.equal(status, 400)
    assert.equal(body.error.code, 'malformedRequest')
    assert.match(body.error.message, /at most 100/)
  })

  test('needs an api key', async () => {
    const { status } = await post(PATH, [item()], {})

    assert.equal(status, 401)
  })
})
