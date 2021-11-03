const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')
const {
  getEmployees,
  getStudentsWithStudyRight,
  getEarlierAttainments,
  getCourseUnitIds
} = require('../services/importer')
const { generateSisuId } = require('../utils/common')
const logger = require('@utils/logger')

const COMMON = {
  gradeId: "1",
  gradeScaleId: "sis-hyl-hyv"
}

const processExtraEntries = async (createdRawEntries) => {
  const success = []
  const failed = []

  const graderIds = [...new Set(createdRawEntries.map((rawEntry) => rawEntry.graderId))]
  const courseIds = [...new Set(createdRawEntries.map(({ courseId }) => courseId))]
  const studentNumbers = [...new Set(createdRawEntries.map((rawEntry) => rawEntry.studentNumber))]

  const [graders, courses, studentsWithStudyRight] = await Promise.all([
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
    getStudentsWithStudyRight(studentNumbers)
  ])

  const employeeIds = graders.map((grader) => grader.employeeId)
  const employees = await getEmployees(employeeIds)
  const earlierAttainments = await getEarlierAttainments(
    createdRawEntries.map(({ courseId, studentNumber }) => {
      const { courseCode } = courses.find((c) => c.id === courseId)
      return { courseCode, studentNumber }
    })
  )
  const courseUnitIds = await getCourseUnitIds(courses.filter(({ useAsExtra }) => useAsExtra).map(({ courseCode }) => courseCode))
  createdRawEntries.forEach((rawEntry) => {
    const course = courses.find((c) => c.id === rawEntry.courseId)
    const completionDate = moment(rawEntry.attainmentDate)
    const grader = graders.find((g) => g.id === rawEntry.graderId)
    const verifier = employees.find(({ employeeNumber }) => employeeNumber === grader.employeeId)

    if (earlierAttainments.find(({ studentNumber, courseCode, attainments }) =>
      rawEntry.studentNumber === studentNumber &&
      course.courseCode === courseCode &&
      attainments.length)
    ) {
      logger.warn({ message: `Attainment already registered with code ${course.courseCode} for student ${rawEntry.studentNumber}` })
      return
    }

    if (!(rawEntry.studentNumber in studentsWithStudyRight)) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: 'Person with student number not found from Sisu'
      })
      return
    }
    if (!verifier) {
      failed.push({
        id: rawEntry.id,
        studentNumber: rawEntry.studentNumber,
        message: `Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`
      })
      return
    }

    const { personId, studyRightId } = studentsWithStudyRight[rawEntry.studentNumber]
    const { courseCode } = course
    const { id: courseUnitId } = getActiveCourseUnitId(courseUnitIds[courseCode])

    success.push({
      ...COMMON,
      courseUnitId,
      personId,
      studyRightId,
      id: generateSisuId(),
      verifierPersonId: verifier.id,
      rawEntryId: rawEntry.id,
      completionDate: completionDate.format('YYYY-MM-DD'),
      completionLanguage: rawEntry.language
    })
  })

  return [failed, success]
}

const getActiveCourseUnitId = (courseUnits) => {
  const now = moment()
  return courseUnits.find(({ validityPeriod }) =>
    moment(validityPeriod.startDate).isSameOrBefore(now) &&
    moment(validityPeriod.endDate).isAfter(now) // dates are half-open intervals, do not include end date
  )
}

module.exports = processExtraEntries
