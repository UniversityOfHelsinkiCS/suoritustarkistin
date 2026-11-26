const Sequelize = require('sequelize')
const moment = require('moment')
const logger = require('@server/utils/logger')
const db = require('../models/index')
const {
  getEmployees,
  getStudents,
  getEarlierAttainments,
  getCourseUnitIds,
  getGrades,
  getMultipleStudyRightsByPersons
} = require('../services/importer')
const { FAILURE_REASONS } = require('../utils/failureReasons')
const { mapGrades } = require('../utils/sisuAttainmentRules')
const { canBeUsedAsExtra } = require('@shared/common')
const { generateSisuId } = require('../utils/common')
const { resolveStudyRight, getClosestStudyRight } = require('../utils/resolveStudyRight')

const { Op } = Sequelize

// Courses with no grade scale in Sisu or Suotar keep the pass/fail scale erilliskirjaus always used
const DEFAULT_GRADE_SCALE = 'sis-hyl-hyv'

const getActiveCourseUnitId = (courseUnits) => {
  const now = moment()
  return courseUnits.find(({ validityPeriod }) => {
    if (!validityPeriod.endDate) return moment(validityPeriod.startDate).isSameOrBefore(now)
    return moment(validityPeriod.startDate).isSameOrBefore(now) && moment(validityPeriod.endDate).isAfter(now) // dates are half-open intervals, do not include end date
  })
}

const processExtraEntries = async (createdRawEntries, requireMatluStudyRight) => {
  const success = []
  const failed = []

  const graderIds = [...new Set(createdRawEntries.map((rawEntry) => rawEntry.graderId))]
  const courseIds = [...new Set(createdRawEntries.map(({ courseId }) => courseId))]
  const studentNumbers = [...new Set(createdRawEntries.map((rawEntry) => rawEntry.studentNumber))]

  const [graders, courses, students] = await Promise.all([
    await db.users.findAll({
      where: {
        id: { [Op.in]: graderIds }
      },
      raw: true
    }),
    await db.courses.findAll({
      where: {
        id: { [Op.in]: courseIds }
      },
      raw: true
    }),
    getStudents(studentNumbers)
  ])
  const studyRights = await getMultipleStudyRightsByPersons(students.map(({ id }) => id))

  const employeeIds = graders.map((grader) => grader.employeeId)
  const employees = await getEmployees(employeeIds)
  const earlierAttainments = await getEarlierAttainments(
    createdRawEntries.map(({ courseId, studentNumber }) => {
      const { courseCode } = courses.find((c) => c.id === courseId)
      return { courseCode, studentNumber }
    })
  )

  const gradeScales = await getGrades()
  const courseUnitIds = await getCourseUnitIds(courses.filter(canBeUsedAsExtra).map(({ courseCode }) => courseCode))
  createdRawEntries.forEach((rawEntry) => {
    const course = courses.find((c) => c.id === rawEntry.courseId)
    let completionDate = moment(rawEntry.attainmentDate)
    const grader = graders.find((g) => g.id === rawEntry.graderId)
    const verifier = employees.find(({ employeeNumber }) => employeeNumber === grader.employeeId)
    const student = students.find((p) => p.studentNumber === rawEntry.studentNumber)

    if (
      earlierAttainments.find(
        ({ studentNumber, courseCode, attainments }) =>
          rawEntry.studentNumber === studentNumber && course.courseCode === courseCode && attainments.length
      ) &&
      requireMatluStudyRight // Skip earlier completions only for kandi
    ) {
      logger.warn({
        message: `Attainment already registered with code ${course.courseCode} for student ${rawEntry.studentNumber}`
      })
      return
    }

    if (!student) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        courseCode: course.courseCode,
        message: 'Person with student number not found from Sisu'
      })
      return
    }
    if (!verifier) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        courseCode: course.courseCode,
        message: `Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`
      })
      return
    }
    if (!canBeUsedAsExtra(course)) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        courseCode: course.courseCode,
        message: `${course.courseCode} not usable for erilliskirjaus`
      })
      return
    }

    const studyRightsForPerson = studyRights.filter(({ personId }) => student.id === personId)
    let { id: studyRightId } = resolveStudyRight(studyRightsForPerson, rawEntry.attainmentDate, requireMatluStudyRight)
    if (!studyRightId)
      [studyRightId, completionDate] = getClosestStudyRight(studyRightsForPerson, rawEntry.attainmentDate)
    const { courseCode } = course
    const courseUnit = getActiveCourseUnitId(courseUnitIds[courseCode])

    // The scale Sisu has for the course unit wins; Suotar's own setting is the fallback
    const gradeScaleId = courseUnit.gradeScaleId || course.gradeScale || DEFAULT_GRADE_SCALE
    const grade = gradeScales[gradeScaleId] && mapGrades(gradeScales, gradeScaleId, rawEntry)
    if (!grade) {
      const availableGrades = (gradeScales[gradeScaleId] || [])
        .filter(({ passed }) => passed)
        .map(({ abbreviation }) => abbreviation.fi)
        .join(', ')
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        courseCode,
        reason: FAILURE_REASONS.INVALID_GRADE,
        message: `Invalid grade "${rawEntry.grade}" for erilliskirjaus on "${courseCode}". Available grades are: ${availableGrades}`
      })
      return
    }
    if (!grade.passed) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        courseCode,
        reason: FAILURE_REASONS.INVALID_GRADE,
        message: `Failing grade "${rawEntry.grade}" cannot be registered as erilliskirjaus`
      })
      return
    }

    success.push({
      gradeId: grade.localId,
      gradeScaleId,
      courseUnitId: courseUnit.id,
      studyRightId,
      id: generateSisuId(),
      personId: student.id,
      studentName: `${student.firstNames.split(' ')[0]} ${student.lastName}`,
      verifierPersonId: verifier.id,
      rawEntryId: rawEntry.id,
      completionDate: completionDate.format('YYYY-MM-DD'),
      completionLanguage: rawEntry.language
    })
  })

  return [failed, success]
}

module.exports = processExtraEntries
