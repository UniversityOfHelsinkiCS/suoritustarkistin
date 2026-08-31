/**
 * Spec section 6: POST /api/enrolments/list-by-course.
 *
 * The importer has no batch route for this, so it is one GET per distinct course code.
 * A code that fails takes down only the items asking for it.
 */

const _ = require('lodash')
const logger = require('@server/utils/logger')
const { getAllCourseUnitEnrolments } = require('@server/services/importer')
const { okItem, errorItem, batchHandler } = require('@server/utils/batchApi')
const { sendSentryError } = require('@server/utils/sentry')

const SISU_UNAVAILABLE = 'Suotar could not serve the list of enrolled people.'

const validateItem = ({ courseCode, courseUnitRealisationId }) => {
  if (typeof courseCode !== 'string' || !courseCode) return 'courseCode must be a non-empty string.'
  if (
    courseUnitRealisationId !== undefined &&
    (typeof courseUnitRealisationId !== 'string' || !courseUnitRealisationId)
  )
    return 'courseUnitRealisationId, when given, must be a non-empty string.'
  return undefined
}

/**
 * getAllCourseUnitEnrolments, not getCourseUnitEnrolments: the latter drops realisations
 * whose activity period ended over two months ago, and the caller filters by realisation
 * itself.
 */
const fetchRealisations = async (code) => {
  const realisations = await getAllCourseUnitEnrolments(code)
  if (!Array.isArray(realisations))
    throw new Error(`Importer returned ${typeof realisations} instead of an array of realisations`)
  return realisations
}

// personId comes off the enrolment row rather than the person: the importer selects only
// five columns of Person, and its id is not among them.
const toPerson = (enrolment) => ({
  studentNumber: enrolment.person?.studentNumber,
  personId: enrolment.personId,
  firstNames: enrolment.person?.firstNames,
  lastName: enrolment.person?.lastName,
  primaryEmail: enrolment.person?.primaryEmail,
  secondaryEmail: enrolment.person?.secondaryEmail,
  enrolment: {
    id: enrolment.id,
    courseUnitRealisationId: enrolment.courseUnitRealisationId,
    state: enrolment.state,
    enrolmentDateTime: enrolment.enrolmentDateTime
  }
})

const listByCourse = batchHandler(async (items) => {
  const byCode = new Map()
  for (const code of _.uniq(items.map((item) => item.courseCode))) {
    try {
      byCode.set(code, { realisations: await fetchRealisations(code) })
    } catch (error) {
      logger.error({ message: `Listing enrolments for ${code} failed`, error: error.message, stack: error.stack })
      sendSentryError('Listing enrolments by course failed', error, { courseCode: code })
      byCode.set(code, { failed: true })
    }
  }

  return items.map(({ requestItemId, courseCode, courseUnitRealisationId }) => {
    const { realisations, failed } = byCode.get(courseCode)
    if (failed) return errorItem(requestItemId, 'sisuTemporarilyUnavailable', SISU_UNAVAILABLE)
    if (!realisations.length)
      return errorItem(requestItemId, 'courseCodeNotFound', 'Course code could not be resolved in Sisu.')

    // An unmatched realisation id is an empty list, not courseCodeNotFound: the code did
    // resolve, and nobody is enrolled on the realisation the caller asked about.
    const wanted = courseUnitRealisationId
      ? realisations.filter(({ id }) => id === courseUnitRealisationId)
      : realisations

    const people = wanted.flatMap(({ enrollments }) => (enrollments || []).map(toPerson))
    return okItem(requestItemId, 'enrolmentsListed', { people })
  })
}, validateItem)

module.exports = { listByCourse }
