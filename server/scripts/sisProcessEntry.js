const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')
const { isImprovedGrade } = require('@utils/sisEarlierCompletions')
const {
  getEmployees,
  getStudents,
  getGrades,
  getEnrolments,
  getEarlierAttainments
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
 * Returns list with two elements:
 *  [failedEntries, validEntries]
 */

const processEntries = async (createdEntries, checkImprovements) => {
  const success = []
  const failed = []
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

  const courseStudentPairs = createdEntries.map(({ courseId, studentNumber }) => {
    const { courseCode } = courses.find((c) => c.id === courseId)
    return ({ courseCode, studentNumber })
  })
  const earlierAttainments = checkImprovements === true ? await getEarlierAttainments(courseStudentPairs) : []

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
    const improvedGrade = isImprovedGrade(earlierAttainments, rawEntry.studentNumber, rawEntry.grade)

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

    const filteredEnrolments = filterEnrolments(rawEntry.attainmentDate, enrolmentsByPersonAndCourse)

    if (!filteredEnrolments || !filteredEnrolments.length) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `Student ${rawEntry.studentNumber} has no enrolments for course ${course.courseCode}`
      })
      return Promise.resolve()
    }

    if (!validateCredits(filteredEnrolments, rawEntry.credits)) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `Invalid credit amount for course ${course.courseCode}, allowed credit range is from ${filteredEnrolments[0].credits.min} to ${filteredEnrolments[0].credits.max}`
      })
      return Promise.resolve()
    }

    // Create here the acual attainments for Sisu
    await Promise.all(
      filteredEnrolments
        .map(async (e) => {
          const grade = mapGrades(gradeScales, e.gradeScaleId, rawEntry)
          if (!grade) {
            failed.push({
              id: rawEntry.id,
              studentNumber: rawEntry.studentNumber,
              message: `
                Invalid grade "${rawEntry.grade}" for course "${course.courseCode}". 
                Available grades are: ${gradeScales[e.gradeScaleId].map(({ abbreviation }) => abbreviation['fi'])}
              `
            })
            return Promise.resolve()
          }
          if (checkImprovements === true && !improvedGrade) {
            failed.push({
              id: rawEntry.id,
              studentNumber: rawEntry.studentNumber,
              message: `Student ${rawEntry.studentNumber} has already higher grade for course ${course.courseCode}`
            })
            return Promise.resolve()
          }
          success.push({
            ...e,
            verifierPersonId: verifier.id,
            rawEntryId: rawEntry.id,
            gradeId: grade.localId,
            completionDate: completionDate.format('YYYY-MM-DD'),
            completionLanguage: rawEntry.language
          })
          return Promise.resolve()
        })
    )
    return Promise.resolve()
  }))

  return [failed, success]
}

const filterEnrolments = (completionDate, { enrolments }) => {
  if (!enrolments) return null
  const sortedEnrolments = enrolments
    .filter((e) => moment(e.courseUnitRealisation.activityPeriod.endDate).isBefore(moment(completionDate)))
    .sort(
      (a, b) => moment(b.courseUnitRealisation.activityPeriod.endDate.endDate)
        .diff(moment(a.courseUnitRealisation.activityPeriod.endDate.endDate))
    )
  if (!sortedEnrolments || !sortedEnrolments.length) return null
  const properEnrolments = sortedEnrolments.filter(
    (e) => e.courseUnitRealisationId === sortedEnrolments[0].courseUnitRealisationId
  )
  return properEnrolments.map(({ assessmentItemId, courseUnitRealisationId, courseUnitId, personId, courseUnit, courseUnitRealisation }) => ({
    courseUnitRealisationName: courseUnitRealisation.name,
    gradeScaleId: courseUnit.gradeScaleId,
    credits: courseUnit.credits,
    assessmentItemId,
    courseUnitRealisationId,
    courseUnitId,
    personId
  }))
}

const validateCredits = (enrolments, targetCredits) => {
  return enrolments.some(({ credits }) => targetCredits >= credits.min && targetCredits <= credits.max)
}

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


module.exports = {
  processEntries
}
