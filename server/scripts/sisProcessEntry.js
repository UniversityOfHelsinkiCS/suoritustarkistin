const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')
const api = require('../config/importerApi')
const qs = require('querystring')
const logger = require('@utils/logger')
const { fetchEarlierAttainments, isImprovedGrade } = require('@utils/sisEarlierCompletions')

const handleImporterApiErrors = (e) => {
  if (e.code === "EAI_AGAIN") throw new Error("Network error. Reload the page and try again")
  if (e.response.data.status === 404) throw new Error(e.response.data.message)
  throw new Error(e.toString())
}


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
 */
const processEntries = async (createdEntries, transaction, checkImprovements) => {
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

  const courseStudentPairs = createdEntries.map(({courseId, studentNumber }) => {
    const { courseCode } = courses.find((c) => c.id === courseId)
    return ({ courseCode, studentNumber })
  })
  const earlierAttainments = checkImprovements === true ? await fetchEarlierAttainments(courseStudentPairs) : []

  const studentCourseCodePairs = createdEntries.map((rawEntry) => ({
    personId: (students.find((person) => person.studentNumber === rawEntry.studentNumber) || {}).id,
    code: courses.find((course) => course.id === rawEntry.courseId).courseCode
  }))
  const enrolments = await getEnrolments(studentCourseCodePairs)

  // We need to flatten the final data, as one raw entry may be
  // mankeled to one or more attainment (entry)
  const data = _.flatten(
    await Promise.all(createdEntries.map(async (rawEntry) => {
      const grader = graders.find((g) => g.id === rawEntry.graderId)
      const verifier = employees.find(({ employeeNumber }) => employeeNumber === grader.employeeId)
      const completionDate = moment(rawEntry.attainmentDate)
      const course = courses.find((c) => c.id === rawEntry.courseId)
      const student = students.find((p) => p.studentNumber === rawEntry.studentNumber)
      const improvedGrade = isImprovedGrade(earlierAttainments, rawEntry.studentNumber, rawEntry.grade)

      if (!student) throw new Error(`Person with student number ${rawEntry.studentNumber} not found from Sisu`)
      if (!verifier) throw new Error(`Person with employee number ${rawEntry.grader.employeeId} not found from Sisu`)

      const enrolmentsByPersonAndCourse = enrolments
        .find((e) => e.personId === student.id && e.code === course.courseCode)

      const filteredEnrolments = filterEnrolments(rawEntry.attainmentDate, enrolmentsByPersonAndCourse)
      if (!filteredEnrolments.length)
        throw new Error(`Student ${rawEntry.studentNumber} has no enrolments for course ${course.courseCode}`)

      // Create here the acual attainments for Sisu
      const assessmentItemAttainments = await Promise.all(
        filteredEnrolments
          .map(async (e) => {
            const grade = mapGrades(gradeScales, e.gradeScaleId, rawEntry)
            if (!grade) throw new Error(`
                Invalid grade "${rawEntry.grade}". Available grades for this course are:
                ${gradeScales[e.gradeScaleId].map(({ abbreviation }) => abbreviation['fi'])}
            `)
            if (checkImprovements === true && !improvedGrade) {
              throw new Error(`Student ${rawEntry.studentNumber} has already higher grade for course ${course.courseCode}`)
            }
            return Promise.resolve({
              ...e,
              verifierPersonId: verifier.id,
              rawEntryId: rawEntry.id,
              gradeId: grade.localId,
              completionDate: completionDate.format('YYYY-MM-DD')
            })
          })
      )
      return Promise.resolve(assessmentItemAttainments)
    }))
  )

  await db.entries.bulkCreate(data, { transaction })
  logger.info({ message: 'Entries success', amount: data.length, sis: true })
  return true
}

const filterEnrolments = (completionDate, { enrolments }) => {
  if (!enrolments) return null
  const sortedEnrolments = enrolments
    .filter((e) => moment(e.courseUnitRealisation.activityPeriod.endDate).isBefore(moment(completionDate)))
    .sort(
      (a, b) => moment(b.courseUnitRealisation.activityPeriod.endDate.endDate)
        .diff(moment(a.courseUnitRealisation.activityPeriod.endDate.endDate))
    )
  if (!sortedEnrolments.length) return null
  const properEnrolments = sortedEnrolments.filter(
    (e) => e.courseUnitRealisationId === sortedEnrolments[0].courseUnitRealisationId
  )
  return properEnrolments.map(({ assessmentItemId, courseUnitRealisationId, courseUnitId, personId, courseUnit, courseUnitRealisation }) => ({
    courseUnitRealisationName: courseUnitRealisation.name,
    gradeScaleId: courseUnit.gradeScaleId,
    assessmentItemId,
    courseUnitRealisationId,
    courseUnitId,
    personId
  }))
}


const mapGrades = (gradeScales, id, rawEntry) => {
  if (id === "sis-0-5") {
    return gradeScales[id].find(({ numericCorrespondence }) => String(numericCorrespondence) === rawEntry.grade)
  } else if (id === "sis-hyl-hyv") {
    return gradeScales[id].find(({ abbreviation }) => abbreviation['fi'] === rawEntry.grade)
  }
}

// TODO: Create endpoint to db.api for batch converting employee ids
async function getEmployees(employeeIds) {
  const responses = await Promise.all(employeeIds.map(async (employeeId) => {
    const resp = await api.get(`employees/${employeeId}`)
    if (!resp.data.length)
      throw new Error(`No person found from Sisu with employee number ${employeeId}`)
    return resp
  }))
  return _.flatten(responses.map((resp) => resp.data))
}

async function getStudents(studentNumbers) {
  try {
    const res = await api.post('students/', studentNumbers)
    return res.data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

async function getEnrolments(studentCourseCodes) {
  try {
    const res = await api.post('suotar/enrolments/', studentCourseCodes)
    return res.data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

/**
 * Get all course instances related to raw entries
 */
async function getCourses(rawEntries) {
  const courseIds = new Set(rawEntries.map(({ courseId }) => courseId))
  return await db.courses.findAll({
    where: {
      id: { [Op.in]: Array.from(courseIds) }
    }
  })
}

async function getGrades(codes = []) {
  const uniqueCodes = _.uniq(codes)
  try {
    const params = qs.stringify({ codes: uniqueCodes })
    const resp = await api.get(`grades?${params}`)
    return resp.data
  } catch (e) {
    handleImporterApiErrors(e)
  }
}

module.exports = {
  processEntries
}
