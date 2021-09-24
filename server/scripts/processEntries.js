const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')
const { v4: uuidv4 } = require('uuid')
const {
  getEmployees,
  getStudents,
  getGrades,
  getEnrolments
} = require('../services/importer')

/**
 * Mankel raw entries to sis entries.
 *
 * Some extra mayhem with grader and course relations as createdEntries contains only
 * raw entries and related foreign keys. We can't query raw entries with include as we
 * are inside a transaction and relations needs to be fetched separately.
 *
 * Mankeling steps:
 *  1. Fetch relations from local db, fetch all necessary persons, attainments etc from importer
 *  2. Fetch enrolments from importer with person id - course code pairs
 *  3. From the enrolments find instances which are for proper course unit realisation, based on the attainment date
 *  4. Mankel again the enrolments to get Suotar entries
 *  5. Resolve all nested promises ??
 *
 * Returns list with three elements:
 *  [failedEntries, validEntries, isMissingEnrollment]
 */

const processEntries = async (createdEntries, checkImprovements, requireEnrollment = false) => {
  const success = []
  const failed = []
  let isMissingEnrollment = false
  const graderIds = new Set(createdEntries.map((rawEntry) => rawEntry.graderId))
  const graders = await db.users.findAll({
    where: {
      id: { [Op.in]: Array.from(graderIds) }
    }
  })
  const courses = await getCourses(createdEntries)
  const gradeScales = await getGrades()

  const studentNumbers = createdEntries.map((rawEntry) => rawEntry.studentNumber)
  const students = await getStudents(studentNumbers)

  const employeeIds = graders.map((grader) => grader.employeeId)
  const employees = await getEmployees(employeeIds)

  const studentCourseCodePairs = createdEntries.map((rawEntry) => ({
    personId: (students.find((person) => person.studentNumber === rawEntry.studentNumber) || {}).id,
    code: courses.find((course) => course.id === rawEntry.courseId).courseCode
  }))
  const enrolments = await getEnrolments(studentCourseCodePairs)

  // We need to flatten the final data, as one raw entry may be
  // mankeled to one or more attainment (entry)
  await Promise.all(createdEntries.map(async (rawEntry) => {
    const grader = graders.find((g) => g.id === rawEntry.graderId)
    const verifier = employees.find(({ employeeNumber }) => employeeNumber === grader.employeeId)
    const completionDate = moment(rawEntry.attainmentDate)
    const course = courses.find((c) => c.id === rawEntry.courseId)
    const student = students.find((p) => p.studentNumber === rawEntry.studentNumber)

    if (!student) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: 'Person with student number not found from Sisu'
      })
      return Promise.resolve()
    }

    if (!verifier) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`
      })
      return Promise.resolve()
    }

    const enrolmentsByPersonAndCourse = enrolments
      .find((e) => e.personId === student.id && e.code === course.courseCode)

    const filteredEnrolment = filterEnrolments(rawEntry.attainmentDate, enrolmentsByPersonAndCourse)

    if (!filteredEnrolment) {
      if (requireEnrollment)
        failed.push({
          id: rawEntry.id,
          studentNumber: rawEntry.studentNumber,
          message: `Student ${rawEntry.studentNumber} has no enrolments for course ${course.courseCode}`
        })
      else {
        success.push({
          id: generateEntryId(),
          personId: student.id,
          verifierPersonId: verifier.id,
          rawEntryId: rawEntry.id,
          completionDate: completionDate.format('YYYY-MM-DD'),
          completionLanguage: rawEntry.language
        })
        isMissingEnrollment = true
      }
      return Promise.resolve()
    }

    if (!validateCredits(filteredEnrolment, parseFloat(rawEntry.credits))) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `Invalid credit amount for course ${course.courseCode}, allowed credit range is from ${filteredEnrolment.credits.min} to ${filteredEnrolment.credits.max}`
      })
      return Promise.resolve()
    }

    // Create here the acual attainments for Sisu
    const grade = mapGrades(gradeScales, filteredEnrolment.gradeScaleId, rawEntry)
    if (!grade) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `
                Invalid grade "${rawEntry.grade}" for course "${course.courseCode}".
                Available grades are: ${gradeScales[filteredEnrolment.gradeScaleId].map(({ abbreviation }) => abbreviation['fi'])}
              `
      })
      return Promise.resolve()
    }

    success.push({
      ...filteredEnrolment,
      id: generateEntryId(),
      verifierPersonId: verifier.id,
      rawEntryId: rawEntry.id,
      gradeId: grade.localId,
      completionDate: completionDate.format('YYYY-MM-DD'),
      completionLanguage: rawEntry.language
    })
    return Promise.resolve()
  }))

  return [failed, success, isMissingEnrollment]
}

/**
 * Find the best matching enrollment. That is:
 *  1. Realisation where completion date is within of activity period
 *  2. Already ended realisation closest to completion date by activity period end
 *  3. Closest upcoming realisation compared to completion date
 * Note: Upcoming realisations (not started based on current date) is never accepted!
 */
const filterEnrolments = (completionDate, { enrolments }) => {
  const enrollmentToObject = ({ assessmentItemId, courseUnitRealisationId, courseUnitId, personId, assessmentItem, courseUnitRealisation, courseUnit }) => ({
    courseUnitRealisationName: courseUnitRealisation.name,
    gradeScaleId: assessmentItem.gradeScaleId,
    credits: courseUnit.credits,
    assessmentItemId,
    courseUnitRealisationId,
    courseUnitId,
    personId
  })

  if (!enrolments) return null
  const now = moment()
  const filteredEnrolments = enrolments
    .filter((e) => moment(e.courseUnitRealisation.activityPeriod.startDate).isSameOrBefore(now))
    .filter((e) => e.courseUnitRealisation.name.fi && !e.courseUnitRealisation.name.fi.includes('MOOC Java'))
    // Hacky solution to filter out MOOC Java enrolments, since there is no other way. Remove in the fall.

  if (!filteredEnrolments.length) return null

  // Get enrollments for realisations already ended or currently active based on completion date
  const activeOrPastByCompletionDate = filteredEnrolments
    .filter((e) => moment(e.courseUnitRealisation.activityPeriod.startDate).isSameOrBefore(completionDate))
    .sort(
      (a, b) => moment(b.courseUnitRealisation.activityPeriod.endDate)
        .diff(moment(a.courseUnitRealisation.activityPeriod.endDate))
    )

  if (activeOrPastByCompletionDate.length)
    return enrollmentToObject(activeOrPastByCompletionDate[0])

  // Get nearest realisation after completion date
  const futureRelisationsByCompletionDate = filteredEnrolments
    .filter((e) => moment(e.courseUnitRealisation.activityPeriod.startDate).isAfter(completionDate))
    .sort(
      (a, b) => moment(a.courseUnitRealisation.activityPeriod.startDate)
        .diff(moment(b.courseUnitRealisation.activityPeriod.startDate))
    )

  if (futureRelisationsByCompletionDate.length)
    return enrollmentToObject(futureRelisationsByCompletionDate[0])
  return null
}

const validateCredits = ({ credits }, targetCredits) => targetCredits >= credits.min && targetCredits <= credits.max

const mapGrades = (gradeScales, id, rawEntry) => {
  let grade = rawEntry.grade
  if (id === "sis-0-5") {
    if (grade === "Hyl." || grade === "-") {
      grade = "0"
    }
    return gradeScales[id].find(({ numericCorrespondence }) => String(numericCorrespondence) === grade)
  } else if (id === "sis-hyl-hyv") {
    if (grade === 0 || grade === "0" || grade === "-") {
      grade = "Hyl."
    }
    return gradeScales[id].find(({ abbreviation }) => abbreviation['fi'] === grade)
  }
}

const getCourses = async (rawEntries) => {
  const courseIds = new Set(rawEntries.map(({ courseId }) => courseId))
  return await db.courses.findAll({
    where: {
      id: { [Op.in]: Array.from(courseIds) }
    },
    raw: true
  })
}

function generateEntryId() {
  return `hy-kur-${uuidv4()}`
}


module.exports = {
  processEntries
}
