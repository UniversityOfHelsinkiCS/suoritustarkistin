/**
 * Spec section 3, everything up to the Sisu send: resolve each item, and write the
 * raw_entries and entries rows a send will use.
 *
 * Deliberately not `processEntries`. That function picks the enrolment itself by matching
 * the attainment date against realisation activity periods, while the spec has the caller
 * name the enrolment it chose in section 2. What Sisu accepts of an attainment is shared
 * through sisuAttainmentRules.js so the two cannot drift on it; the duplicate and
 * improvement checks come from earlierCompletions.js, where this path does differ -- it
 * scopes the improvement check to the item's own course.
 */

const moment = require('moment')
const { v4: uuidv4 } = require('uuid')

const {
  ALL_EOAI_CODES,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE
} = require('@shared/common')

const db = require('../models/index')
const { getDateWithinStudyright, validateCredits, mapGrades, generateEntryId } = require('../utils/sisuAttainmentRules')
const { identicalCompletionFound, isImprovedGrade } = require('../utils/earlierCompletions')
const {
  getStudents,
  getGrades,
  findEmployees,
  getEnrolments,
  getMultipleStudyRights,
  getEarlierAttainmentsWithoutSubstituteCourses
} = require('../services/importer')

const ATTAINMENT_TYPE = 'AssessmentItemAttainment'

// The only state an attainment may be registered against, checked here rather than trusted
// of the importer. Section 2 answers enrolmentNotAccepted for the rest; section 3 has no such
// code, so an enrolment in any other state is simply not found.
const ACCEPTED_STATE = 'ENROLLED'

// Two importer sync runs, hourly per importer-api's cron, with room for a skipped tick.
const COOLDOWN_MS = 2 * 60 * 60 * 1000

/**
 * TEMPORARY. Elements of AI and Building AI have their own registration paths in the automated
 * jobs, and how they should behave through this API is not settled. Blocked until it is.
 */
const UNSETTLED_COURSE_CODES = new Set([
  ...ALL_EOAI_CODES,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE
])

// The two ways resolveItem answers an item outright. The third is returning rows to send.
const answer = (requestItemId, code, result) => ({ result: { requestItemId, status: 'ok', code, result } })
const reject = (requestItemId, code, message) => ({
  result: { requestItemId, status: 'error', code, error: { message } }
})

const key = (left, right) => `${left} ${right}`

// An existing attainment as duplicateAttainment and notImprovedAttainment report it.
const toAttainment = (attainment) => ({
  id: attainment.id,
  type: attainment.type,
  state: attainment.state,
  attainmentDate: attainment.attainmentDate,
  registrationDate: attainment.registrationDate,
  gradeScaleId: attainment.gradeScaleId,
  gradeId: attainment.gradeId
})

/**
 * mooc.fi sends (gradeScaleId, gradeId); Suotar's rules downstream are written against the
 * Finnish grade string. The enrolment's scale wins over the one the caller sent, which is
 * what the spec means by "not valid for the resolved enrolment's grade scale".
 */
const gradeOnScale = (gradeScales, gradeScaleId, gradeId) => {
  const abbreviation = gradeScales[gradeScaleId]?.find(({ localId }) => String(localId) === String(gradeId))
    ?.abbreviation?.fi
  if (!abbreviation) return undefined
  const grade = mapGrades(gradeScales, gradeScaleId, { grade: abbreviation })
  return grade && { abbreviation, localId: grade.localId }
}

/**
 * One batch of lookups for the whole request, exposed as lookups by item so the keying stays
 * in here. `earlierAttainments` is also exposed whole, because the shared checks take a batch
 * and find the student in it themselves; resolveItem narrows it where a check needs it.
 */
const fetchContext = async (items) => {
  const courses = await db.courses.findAll({
    where: { courseCode: [...new Set(items.map(({ courseCode }) => courseCode))] },
    include: [{ association: 'graders' }]
  })
  const coursesByCode = new Map(courses.map((course) => [course.courseCode, course]))

  // Several graders per course is normal, so the lowest id wins for a stable choice.
  const graderFor = (course) => [...(course.graders || [])].sort((a, b) => a.id - b.id)[0]
  const acceptors = await findEmployees(
    courses
      .map(graderFor)
      .map((grader) => grader?.employeeId)
      .filter(Boolean)
  )

  const persons = await getStudents([...new Set(items.map(({ studentNumber }) => studentNumber))])
  const personsByStudentNumber = new Map((persons || []).map((person) => [person.studentNumber, person]))

  const resolvable = [
    ...new Map(
      items
        .filter(
          ({ studentNumber, courseCode }) => personsByStudentNumber.has(studentNumber) && coursesByCode.has(courseCode)
        )
        .map((item) => [key(item.studentNumber, item.courseCode), item])
    ).values()
  ]

  const groups = resolvable.length
    ? await getEnrolments(
        resolvable.map(({ studentNumber, courseCode }) => ({
          personId: personsByStudentNumber.get(studentNumber).id,
          code: courseCode
        }))
      )
    : []
  const enrolmentsByPair = new Map((groups || []).map((group) => [key(group.personId, group.code), group.enrolments]))

  const studyRightIds = [
    ...new Set((groups || []).flatMap(({ enrolments }) => (enrolments || []).map(({ studyRightId }) => studyRightId)))
  ].filter(Boolean)
  const studyRights = studyRightIds.length ? await getMultipleStudyRights(studyRightIds) : []

  const earlierAttainments = resolvable.length
    ? await getEarlierAttainmentsWithoutSubstituteCourses(
        resolvable.map(({ studentNumber, courseCode }) => ({ studentNumber, courseCode }))
      )
    : []

  return {
    studyRights,
    earlierAttainments,
    gradeScales: await getGrades(),
    courseFor: ({ courseCode }) => coursesByCode.get(courseCode),
    graderFor,
    acceptorFor: (grader) => acceptors.get(grader.employeeId),
    personFor: ({ studentNumber }) => personsByStudentNumber.get(studentNumber),
    enrolmentsFor: (person, { courseCode }) => enrolmentsByPair.get(key(person.id, courseCode)) || [],
    attainmentsFor: ({ studentNumber, courseCode }) =>
      (
        earlierAttainments.find((a) => a.studentNumber === studentNumber && a.courseCode === courseCode)?.attainments ||
        []
      )
        .filter((a) => !a.misregistration)
        // Newest first
        .sort((a, b) => moment(b.attainmentDate).diff(moment(a.attainmentDate)))
  }
}

/**
 * Resolves one item: what Suotar is configured for first, then what Sisu knows, then the
 * payload itself. Reads the context rather than the importer, except that
 * getDateWithinStudyright falls back to a per-person lookup when the enrolment's own study
 * right did not come back.
 */
const resolveItem = async (item, context) => {
  const { requestItemId, studentNumber, courseCode, enrolmentId, attainmentDate, attainmentLanguage } = item

  if (UNSETTLED_COURSE_CODES.has(courseCode)) {
    return reject(requestItemId, 'courseNotAllowed', `${courseCode} cannot be registered through this API yet.`)
  }

  const course = context.courseFor(item)
  if (!course) return reject(requestItemId, 'courseNotAllowed', 'Suotar does not carry this course code.')

  const grader = context.graderFor(course)
  if (!grader) return reject(requestItemId, 'acceptorNotFound', 'The course has no grader in Suotar.')

  const acceptor = context.acceptorFor(grader)
  if (!acceptor) return reject(requestItemId, 'acceptorNotFound', 'No Sisu person was found to accept the attainment.')

  const person = context.personFor(item)
  if (!person)
    return reject(requestItemId, 'personNotFound', 'No Sisu person was found for the supplied student number.')

  // The enrolment the caller named in section 2, not whichever one the attainment date
  // happens to match.
  const enrolment = context
    .enrolmentsFor(person, item)
    .find(({ id, state }) => id === enrolmentId && state === ACCEPTED_STATE)
  if (!enrolment)
    return reject(
      requestItemId,
      'enrolmentNotFound',
      'No ENROLLED Sisu enrolment was found for this student and course code.'
    )

  const credits = enrolment.courseUnit?.credits
  if (!credits) {
    return reject(requestItemId, 'invalidCredits', `Sisu gives no credit range for course ${courseCode}.`)
  }
  if (!validateCredits({ credits }, item.credits)) {
    return reject(
      requestItemId,
      'invalidCredits',
      `Credits must be between ${credits.min} and ${credits.max} for course ${courseCode}.`
    )
  }

  const gradeScaleId = enrolment.assessmentItem?.gradeScaleId ?? enrolment.courseUnit?.gradeScaleId
  const grade = gradeOnScale(context.gradeScales, gradeScaleId, item.gradeId)
  if (!grade)
    return reject(
      requestItemId,
      'invalidGradeForGradeScale',
      "Grade id is not valid for the resolved enrolment's grade scale."
    )

  const creditsAsString = String(item.credits)
  const [previous] = context.attainmentsFor(item)
  const previousAttainment = previous && toAttainment(previous)
  const { earlierAttainments } = context
  // isImprovedGrade matches on student number alone, so it must be handed this course's row
  // only; in a mixed-course batch it would otherwise consult whichever row came back first.
  const courseAttainments = earlierAttainments.filter((a) => a.courseCode === courseCode)

  if (
    identicalCompletionFound(
      earlierAttainments,
      studentNumber,
      courseCode,
      grade.abbreviation,
      attainmentDate,
      creditsAsString
    )
  ) {
    // TODO: return the specific attainment that identicalCompletionFound matched?
    return answer(requestItemId, 'duplicateAttainment', { attainment: previousAttainment })
  }

  // Every earlier attainment on the course has to be beaten, not just the latest one.
  if (!isImprovedGrade(courseAttainments, studentNumber, grade.abbreviation, attainmentDate, creditsAsString)) {
    return answer(requestItemId, 'notImprovedAttainment', { previousAttainment })
  }

  const validAttainmentDate = await getDateWithinStudyright(
    context.studyRights,
    person.id,
    { ...enrolment, credits },
    moment(attainmentDate)
  )
  if (!validAttainmentDate) {
    return reject(requestItemId, 'studyRightNotValid', 'Study right cannot support the attainment.')
  }

  return {
    rows: {
      rawEntry: {
        studentNumber,
        batchId: `moocfi-${uuidv4()}`,
        grade: grade.abbreviation,
        credits: creditsAsString,
        language: attainmentLanguage,
        attainmentDate,
        graderId: grader.id,
        reporterId: null,
        courseId: course.id,
        moocfiRequestItemId: requestItemId
      },
      entry: {
        id: generateEntryId(),
        personId: person.id,
        studentName: `${person.firstNames.split(' ')[0]} ${person.lastName}`,
        email: person.primaryEmail || person.secondaryEmail,
        verifierPersonId: acceptor.id,
        courseUnitRealisationId: enrolment.courseUnitRealisationId,
        courseUnitRealisationName: enrolment.courseUnitRealisation?.name,
        assessmentItemId: enrolment.assessmentItemId,
        courseUnitId: enrolment.courseUnitId,
        gradeScaleId,
        gradeId: grade.localId,
        completionDate: moment(validAttainmentDate).format('YYYY-MM-DD'),
        completionLanguage: attainmentLanguage
      }
    }
  }
}

/**
 * Submissions whose outcome is not yet knowable. Sisu was asked about these less than
 * COOLDOWN_MS ago, and the importer syncs hourly, so neither verify nor the duplicate check
 * can yet say whether the attainment landed -- submitting again risks a second one.
 *
 * `errors` exempts a submission: it is written only when Sisu evaluated the attainment and
 * refused it, so nothing exists in Sisu and a corrected retry is safe immediately.
 */
const findPendingSubmissions = async (requestItemIds) => {
  const rows = await db.raw_entries.findAll({
    where: { moocfiRequestItemId: requestItemIds },
    include: [{ association: 'entry' }]
  })
  const cutoff = Date.now() - COOLDOWN_MS
  return new Map(
    rows
      .filter(({ entry }) => entry && !entry.errors && entry.createdAt.getTime() > cutoff)
      .sort((a, b) => a.entry.createdAt - b.entry.createdAt)
      .map((row) => [row.moocfiRequestItemId, row.entry])
  )
}

// Not a spec code: the spec has mooc.fi carry the retry risk, which it cannot do while the
// data it is told to verify against lags behind Sisu.
const submissionPending = (requestItemId, entry) => ({
  requestItemId,
  status: 'error',
  code: 'submissionPending',
  error: {
    message: 'This completion was submitted recently and its outcome is not yet confirmed. Verify before retrying.'
  },
  result: {
    submittedAttainmentId: entry.id,
    submittedAttainmentType: ATTAINMENT_TYPE,
    retryAfter: new Date(entry.createdAt.getTime() + COOLDOWN_MS).toISOString()
  }
})

/**
 * One transaction for the batch. Everything here has already passed every check, so the only
 * way to fail is the database itself -- and then no completion should be left half-written.
 */
const writeAll = async (resolved) => {
  const transaction = await db.sequelize.transaction()
  try {
    const written = []
    for (const { requestItemId, rows } of resolved) {
      const rawEntry = await db.raw_entries.create(rows.rawEntry, { transaction })
      const entry = await db.entries.create({ ...rows.entry, rawEntryId: rawEntry.id }, { transaction })
      written.push({ requestItemId, entry })
    }
    await transaction.commit()
    return written
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

/**
 * `results` are the items already answered; `toSend` are the entries whose attainment still
 * has to reach Sisu, in request order. The caller merges the two by requestItemId.
 *
 * An item that cannot be registered is answered and costs the others nothing. A failure
 * while resolving is different: the writes come after every item and run in one transaction,
 * so an importer or database error leaves the database exactly as it found it.
 */
const processMoocfiImport = async (items) => {
  const pending = await findPendingSubmissions(items.map(({ requestItemId }) => requestItemId))
  const fresh = items.filter(({ requestItemId }) => !pending.has(requestItemId))
  const context = fresh.length ? await fetchContext(fresh) : null

  const results = [...pending].map(([requestItemId, entry]) => submissionPending(requestItemId, entry))

  // Resolved in full before anything is written, so an importer failure partway through the
  // batch leaves no completion behind and the request can simply be retried.
  const resolved = []
  for (const item of fresh) {
    const { result, rows } = await resolveItem(item, context)
    if (result) {
      results.push(result)
    } else {
      resolved.push({ requestItemId: item.requestItemId, rows })
    }
  }

  const toSend = await writeAll(resolved)

  const order = new Map(items.map(({ requestItemId }, index) => [requestItemId, index]))
  const byRequestOrder = (a, b) => order.get(a.requestItemId) - order.get(b.requestItemId)
  return { results: results.sort(byRequestOrder), toSend: toSend.sort(byRequestOrder) }
}

module.exports = { processMoocfiImport }
