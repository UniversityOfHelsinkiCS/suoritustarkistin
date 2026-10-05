/**
 * The rules about what Sisu will accept for an attainment, shared by every path that builds
 * one: the grader UI, the automated jobs and the courses.mooc.fi import. Kept here rather
 * than in any one caller so the paths cannot drift on what Sisu considers valid.
 */

const moment = require('moment')
const { v4: uuidv4 } = require('uuid')

const logger = require('@server/utils/logger')
const { getMultipleStudyRightsByPersons } = require('../services/importer')
const { resolveStudyRight, getClosestStudyRight, resolveTerm } = require('./resolveStudyRight')

const validateCredits = ({ credits }, targetCredits) => targetCredits >= credits.min && targetCredits <= credits.max

const findAttendingRegistration = (termRegistrations, date) => {
  const { attainmentStartYear, attainmentTermIndex } = resolveTerm(date)
  return (termRegistrations?.termRegistrations || []).find(
    (r) =>
      r?.termRegistrationType === 'ATTENDING' &&
      r.studyTerm?.studyYearStartYear === attainmentStartYear &&
      r.studyTerm.termIndex === attainmentTermIndex
  )
}

// A bare day like valid.startDate; UTC midnight is what Sisu reads back as that day
const asSisuDay = (date) => moment.utc(moment(date).format('YYYY-MM-DD'))

// Sent at UTC midnight, today's date is in the future for Sisu until 03:00 Helsinki time
const asLocalMidnight = (sisuDay) => moment(sisuDay.format('YYYY-MM-DD'))

// A study right without an end date is open-ended
const isBeforeEnd = (date, { endDate }) => !endDate || date.isBefore(endDate)

/**
 * Sisu refuses an attainment dated before the student registered as attending for its term.
 * Returns the registration date when it is later than the attainment but still within the same
 * term and study right, otherwise null: moving any further only trades one refusal for another.
 */
const getLateTermRegistrationDate = ({ term_registrations, valid }, attainmentDate) => {
  const registration = findAttendingRegistration(term_registrations, attainmentDate)
  if (!registration?.registrationDate) return null

  const registrationDate = moment.utc(registration.registrationDate)
  if (!registrationDate.isAfter(attainmentDate)) return null

  const attainmentTerm = resolveTerm(attainmentDate)
  const registrationTerm = resolveTerm(registrationDate)
  if (
    registrationTerm.attainmentStartYear !== attainmentTerm.attainmentStartYear ||
    registrationTerm.attainmentTermIndex !== attainmentTerm.attainmentTermIndex ||
    !isBeforeEnd(registrationDate, valid)
  ) {
    return null
  }

  return registrationDate
}

// An extension made by enrolling happens at the enrolment; the importer sees it up to a day later
const getLapseEnd = ({ endedOn, extendedAt }, enrolmentDateTime) => {
  const enrolled = enrolmentDateTime && moment(enrolmentDateTime)
  return enrolled && !enrolled.isBefore(endedOn) && enrolled.isBefore(extendedAt) ? enrolled : moment(extendedAt)
}

/**
 * A study right that lapsed and was later extended looks unbroken in its newest validity, yet
 * Sisu refuses an attainment dated before the day of the extension. The importer reads the lapses
 * from the version history; the attainment moves to the day the lapse ended. Seen only on study
 * rights without term registrations, so those with them are left alone.
 */
const getLapseEndDate = ({ lapses, valid, term_registrations }, { enrolmentDateTime }, attainmentDate) => {
  if (term_registrations?.termRegistrations?.length) return null

  const lapseEnd = (lapses || [])
    .map((lapse) => ({ endedOn: lapse.endedOn, endDay: asSisuDay(getLapseEnd(lapse, enrolmentDateTime)) }))
    .find(({ endedOn, endDay }) => !moment(endedOn).isAfter(attainmentDate) && endDay.isAfter(attainmentDate))
  if (!lapseEnd || !isBeforeEnd(lapseEnd.endDay, valid)) return null

  return lapseEnd.endDay
}

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

    const lapseEndDate = getLapseEndDate(enrolmentStudyRight, filteredEnrolment, newAttainmentDate)
    if (lapseEndDate) {
      logger.info({
        message: `Attainment date ${newAttainmentDate} falls in a study right lapse that ended ${lapseEndDate}`,
        studyRightId: enrolmentStudyRight.id
      })
      newAttainmentDate = asLocalMidnight(lapseEndDate)
    }

    const registrationDate = getLateTermRegistrationDate(enrolmentStudyRight, newAttainmentDate)
    if (registrationDate) {
      logger.info({
        message: `Attainment date ${newAttainmentDate} is before term registration date ${registrationDate}`,
        studyRightId: enrolmentStudyRight.id
      })
      newAttainmentDate = asLocalMidnight(registrationDate)
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

// The only enrolment state an attainment may be registered against.
const ACCEPTED_ENROLMENT_STATE = 'ENROLLED'

const ASSESSMENT_ITEM_ATTAINMENT_TYPE = 'AssessmentItemAttainment'
const COURSE_UNIT_ATTAINMENT_TYPE = 'CourseUnitAttainment'

module.exports = {
  validateCredits,
  getDateWithinStudyright,
  mapGrades,
  generateEntryId,
  ACCEPTED_ENROLMENT_STATE,
  ASSESSMENT_ITEM_ATTAINMENT_TYPE,
  COURSE_UNIT_ATTAINMENT_TYPE
}
