/**
 * Spec section 6: POST /api/enrolments/list-by-course.
 *
 * The importer has no batch route for this, so it is one GET per distinct course code.
 */

const _ = require('lodash')
const { getCourseUnitEnrolments } = require('@server/services/importer')
const { batchHandler } = require('@server/utils/batchApi')
const { CODES, okItem, errorItem, serviceUnavailable, requireImporterArray } = require('@server/utils/moocfiResults')

const validateItem = ({ courseCode, courseUnitRealisationId }) => {
  if (typeof courseCode !== 'string' || !courseCode) return 'courseCode must be a non-empty string.'
  if (courseUnitRealisationId !== undefined)
    return 'courseUnitRealisationId is not accepted; every person comes with the realisation they are enrolled on.'
  return undefined
}

const fetchRealisations = async (code) => requireImporterArray(await getCourseUnitEnrolments(code), 'realisations')

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
      byCode.set(code, await fetchRealisations(code))
    } catch (error) {
      throw serviceUnavailable('Listing enrolments by course failed', error, { courseCode: code })
    }
  }

  return items.map(({ requestItemId, courseCode }) => {
    const realisations = byCode.get(courseCode)
    if (!realisations.length) return errorItem(requestItemId, CODES.courseCodeNotFound)

    const people = realisations.flatMap(({ enrollments }) => (enrollments || []).map(toPerson))
    return okItem(requestItemId, CODES.enrolmentsListed, { people })
  })
}, validateItem)

module.exports = { listByCourse }
