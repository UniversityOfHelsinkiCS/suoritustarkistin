/**
 * The rules about what Sisu will accept for an attainment, shared by every path that builds
 * one: the grader UI, the automated jobs and the courses.mooc.fi import. Kept here rather
 * than in any one caller so the paths cannot drift on what Sisu considers valid.
 */

const moment = require('moment')
const { v4: uuidv4 } = require('uuid')

const logger = require('@server/utils/logger')
const { getMultipleStudyRightsByPersons } = require('../services/importer')
const { resolveStudyRight, getClosestStudyRight } = require('./resolveStudyRight')

const validateCredits = ({ credits }, targetCredits) => targetCredits >= credits.min && targetCredits <= credits.max

const getDateWithinStudyright = async (studyRights, personId, filteredEnrolment, attainmentDate) => {
  if (!studyRights || !personId || !attainmentDate) return null
  const enrolmentStudyRight = studyRights.find(
    (s) => s.id === filteredEnrolment.studyRightId && s.personId === personId
  )

  // If there is a studyright attached to the enrolment, the completion date
  // needs to be in between studyright's start and end
  if (enrolmentStudyRight) {
    const { valid } = enrolmentStudyRight
    const studyRightStart = moment(valid.startDate)
    const studyRightEnd = moment(valid.endDate)

    let newAttainmentDate
    if (attainmentDate.isBetween(studyRightStart, studyRightEnd)) {
      newAttainmentDate = attainmentDate
    } else if (attainmentDate.isSameOrBefore(studyRightStart)) {
      // the API does not handle properly timezones
      newAttainmentDate = studyRightStart.add(3, 'hours')
    } else if (attainmentDate.isSameOrAfter(studyRightEnd)) {
      newAttainmentDate = studyRightEnd.subtract(1, 'day')
    }

    // If the grant date of studyright is after the start
    // of studyright the completion fails in Sisu
    const grantDate = moment(enrolmentStudyRight.grantDate)
    if (grantDate.isBetween(studyRightStart, studyRightEnd) && newAttainmentDate.isBefore(grantDate)) {
      logger.info({
        message: `Attainment date ${newAttainmentDate} is before grant date ${grantDate}`,
        enrolmentStudyRight
      })
      newAttainmentDate = grantDate
    }

    return newAttainmentDate
  }

  // If there is no studyright attached to the enrolment, as long as the student
  // has any enrolment for the time of the registration, it will pass
  const allStudyRights = await getMultipleStudyRightsByPersons([personId])

  const { id: studyRightId } = resolveStudyRight(allStudyRights, attainmentDate)
  if (studyRightId) return attainmentDate

  // If there is no active studyright get the closest possible date within past studyrights
  const [_studyRightId, newAttainmentDate] = getClosestStudyRight(allStudyRights, attainmentDate)
  return newAttainmentDate
}

const mapGrades = (gradeScales, id, rawEntry) => {
  let { grade } = rawEntry
  if (id === 'sis-0-5') {
    if (grade === 'Hyl.' || grade === '-') {
      grade = '0'
    }
    return gradeScales[id].find(({ numericCorrespondence }) => String(numericCorrespondence) === grade)
  }
  if (id === 'sis-hyl-hyv') {
    if (grade === 0 || grade === '0' || grade === '-') {
      grade = 'Hyl.'
    }
    return gradeScales[id].find(({ abbreviation }) => abbreviation.fi === grade)
  }
}

// An entry id is the attainment id Sisu is given, so it is generated here and nowhere else.
const generateEntryId = () => `hy-kur-${uuidv4()}`

const ASSESSMENT_ITEM_ATTAINMENT_TYPE = 'AssessmentItemAttainment'
const COURSE_UNIT_ATTAINMENT_TYPE = 'CourseUnitAttainment'

module.exports = {
  validateCredits,
  getDateWithinStudyright,
  mapGrades,
  generateEntryId,
  ASSESSMENT_ITEM_ATTAINMENT_TYPE,
  COURSE_UNIT_ATTAINMENT_TYPE
}
