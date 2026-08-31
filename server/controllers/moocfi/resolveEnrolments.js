/**
 * Spec section 2: POST /api/enrolments/resolve.
 *
 * Everything here is projection of data the importer already returns. The lookups are
 * batch-wide, so an importer failure fails every item rather than the request.
 */

const _ = require('lodash')
const logger = require('@server/utils/logger')
const {
  getStudents,
  getCourseUnitIds,
  getEnrolments,
  getMultipleStudyRights,
  getEarlierAttainmentsWithoutSubstituteCourses
} = require('@server/services/importer')
const { okItem, errorItem, batchHandler } = require('@server/utils/batchApi')
const { sendSentryError } = require('@server/utils/sentry')

const ACCEPTED_STATE = 'ENROLLED'

const validateItem = ({ studentNumber, courseCode }) => {
  if (typeof studentNumber !== 'string' || !studentNumber) return 'studentNumber must be a non-empty string.'
  if (typeof courseCode !== 'string' || !courseCode) return 'courseCode must be a non-empty string.'
  return undefined
}

const key = (left, right) => `${left} ${right}`

// The convention already used by resolveStudyRight.js: Sisu has no field for this.
const kindOf = (studyRightId) => (studyRightId?.includes('avoin') ? 'openUniversity' : 'degree')

const toEnrolment = (enrolment, studyRightValidityPeriod) => ({
  id: enrolment.id,
  state: enrolment.state,
  kind: kindOf(enrolment.studyRightId),
  courseUnitId: enrolment.courseUnitId,
  assessmentItemId: enrolment.assessmentItemId,
  courseUnitRealisationId: enrolment.courseUnitRealisationId,
  courseUnitRealisationName: enrolment.courseUnitRealisation?.name,
  activityPeriod: enrolment.courseUnitRealisation?.activityPeriod,
  // The assessment item carries the scale the attainment is graded on; the course unit is
  // the fallback when the item has none.
  gradeScaleId: enrolment.assessmentItem?.gradeScaleId ?? enrolment.courseUnit?.gradeScaleId,
  credits: enrolment.assessmentItem?.credits ?? enrolment.courseUnit?.credits,
  studyRightId: enrolment.studyRightId,
  studyRightValidityPeriod,
  enrolmentDateTime: enrolment.enrolmentDateTime
})

// `passed` is not a column: the importer derives it from the grade scale and hangs it on
// each attainment as `grade`.
const toAttainment = (attainment) => ({
  id: attainment.id,
  type: attainment.type,
  state: attainment.state,
  personId: attainment.personId,
  courseUnitId: attainment.courseUnitId,
  assessmentItemId: attainment.assessmentItemId,
  courseUnitRealisationId: attainment.courseUnitRealisationId,
  attainmentDate: attainment.attainmentDate,
  registrationDate: attainment.registrationDate,
  gradeScaleId: attainment.gradeScaleId,
  gradeId: attainment.gradeId,
  passed: attainment.grade?.passed
})

const requireArray = (value, what) => {
  if (!Array.isArray(value)) throw new Error(`Importer returned ${typeof value} instead of an array of ${what}`)
  return value
}

/**
 * Resolves the whole batch in five batch-wide importer calls: persons, course codes,
 * enrolments, the study rights those enrolments point at, and earlier attainments.
 */
const resolveBatch = async (items) => {
  const persons = requireArray(await getStudents(_.uniq(items.map((item) => item.studentNumber))), 'persons')
  const personsByStudentNumber = new Map(persons.map((person) => [person.studentNumber, person]))

  const courseUnitsByCode = (await getCourseUnitIds(_.uniq(items.map((item) => item.courseCode)))) || {}
  const knownCodes = new Set(Object.keys(courseUnitsByCode).filter((code) => courseUnitsByCode[code]?.length))

  // Only items that resolved on both sides are worth asking the importer about.
  const resolvable = _.uniqBy(
    items.filter(
      ({ studentNumber, courseCode }) => personsByStudentNumber.has(studentNumber) && knownCodes.has(courseCode)
    ),
    ({ studentNumber, courseCode }) => key(studentNumber, courseCode)
  )

  const groups = resolvable.length
    ? requireArray(
        await getEnrolments(
          resolvable.map(({ studentNumber, courseCode }) => ({
            personId: personsByStudentNumber.get(studentNumber).id,
            code: courseCode
          }))
        ),
        'enrolment groups'
      )
    : []
  const enrolmentsByPair = new Map(groups.map((group) => [key(group.personId, group.code), group.enrolments || []]))

  const studyRightIds = _.uniq(
    groups.flatMap(({ enrolments }) => (enrolments || []).map(({ studyRightId }) => studyRightId)).filter(Boolean)
  )
  const studyRights = studyRightIds.length
    ? requireArray(await getMultipleStudyRights(studyRightIds), 'study rights')
    : []
  const validityById = new Map(studyRights.map(({ id, valid }) => [id, valid]))

  const attainmentGroups = resolvable.length
    ? requireArray(
        await getEarlierAttainmentsWithoutSubstituteCourses(
          resolvable.map(({ studentNumber, courseCode }) => ({ studentNumber, courseCode }))
        ),
        'attainment groups'
      )
    : []
  const attainmentsByPair = new Map(
    attainmentGroups.map((group) => [key(group.studentNumber, group.courseCode), group.attainments || []])
  )

  return { personsByStudentNumber, knownCodes, enrolmentsByPair, validityById, attainmentsByPair }
}

const resolveEnrolments = batchHandler(async (items) => {
  let resolved
  try {
    resolved = await resolveBatch(items)
  } catch (error) {
    logger.error({ message: 'Resolving enrolments failed', error: error.message, stack: error.stack })
    sendSentryError('Resolving enrolments failed', error, { items: items.length })
    return items.map(({ requestItemId }) =>
      errorItem(requestItemId, 'sisuTemporarilyUnavailable', 'Sisu was temporarily unavailable.')
    )
  }

  const { personsByStudentNumber, knownCodes, enrolmentsByPair, validityById, attainmentsByPair } = resolved

  return items.map(({ requestItemId, studentNumber, courseCode }) => {
    const person = personsByStudentNumber.get(studentNumber)
    if (!person)
      return errorItem(requestItemId, 'personNotFound', 'No Sisu person was found for the supplied student number.')
    if (!knownCodes.has(courseCode))
      return errorItem(requestItemId, 'courseCodeNotFound', 'Course code could not be resolved in Sisu.')

    const all = enrolmentsByPair.get(key(person.id, courseCode)) || []
    if (!all.length)
      return errorItem(requestItemId, 'enrolmentNotFound', 'No Sisu enrolment was found for this person and course.')

    const accepted = all.filter(({ state }) => state === ACCEPTED_STATE)
    // Unreachable since importer itself currently filters on state: 'ENROLLED'
    if (!accepted.length)
      return errorItem(requestItemId, 'enrolmentNotAccepted', 'The Sisu enrolment has not been accepted.')

    return okItem(requestItemId, 'enrolmentFound', {
      enrolments: accepted.map((enrolment) => toEnrolment(enrolment, validityById.get(enrolment.studyRightId))),
      existingAttainments: (attainmentsByPair.get(key(studentNumber, courseCode)) || []).map(toAttainment)
    })
  })
}, validateItem)

module.exports = { resolveEnrolments }
