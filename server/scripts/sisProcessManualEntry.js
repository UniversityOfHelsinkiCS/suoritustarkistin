const moment = require('moment')
const db = require('../models/index')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount
} = require('../../utils/validators')
const { processEntries } = require('./sisProcessEntry')
const { getRegistrations } = require('../services/eduweb')
const logger = require('@utils/logger')

const LANGUAGES = ["fi", "sv", "en"]

const validateEntry = ({
  studentId,
  grade,
  credits,
  language
}) => {
  if (!isValidStudentId(studentId)) {
    throw new Error(`'${studentId}' is not valid student id`)
  }
  if (grade && !isValidGrade(grade)) {
    throw new Error(`'${grade}' is not valid grade`)
  }
  if (credits && !isValidCreditAmount(credits)) {
    throw new Error(`'${credits}' is not valid credit amount`)
  }
  if (language && !LANGUAGES.includes(language)) {
    throw new Error(`'${language}' is not valid language`)
  }
}

const validateCourse = (courseCode) => {
  if (
    courseCode.substring(0, 2) !== 'AY'
    && courseCode.substring(0, 3) !== 'TKT'
    && courseCode.substring(0, 3) !== 'CSM'
    && courseCode.substring(0, 4) !== 'BSCS'
    && courseCode.substring(0, 3) !== 'MAT'
  ) {
    throw new Error(`Unknown course organization ${courseCode}`)
  }
}

const processManualEntry = async ({
  graderId,
  reporterId,
  courseId,
  date,
  data
}, transaction) => {

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!course) throw new Error('Course id does not exist.')

  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')

  const batchId = `${course.courseCode}%${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  const registrations = course.autoSeparate
    ? await getRegistrations([`AY${course.courseCode}`])
    : undefined

  const rawEntries = data.map((rawEntry) => {
    validateEntry(rawEntry)
    validateCourse(course.courseCode)

    // Separation for combo-courses
    // If the student has a registration to the Open uni -course,
    // they will be given a completion with an open university completion with AYXXXXXX -course code
    if (registrations && registrations.find((r) => r.onro === rawEntry.studentId)) {
      return {
        studentNumber: rawEntry.studentId,
        batchId: batchId,
        grade: rawEntry.grade ? rawEntry.grade : 'Hyv.',
        credits: rawEntry.credits ? rawEntry.credits : course.credits,
        language: rawEntry.language ? rawEntry.language : course.language,
        attainmentDate: rawEntry.attainmentDate ? rawEntry.attainmentDate : date,
        graderId: grader.id,
        reporterId: reporterId,
        courseId: course.id,
        isOpenUni: true
      }
    }

    // If there is no registration, a regular completion with TKTXXXXX -course code is given
    return {
      studentNumber: rawEntry.studentId,
      batchId: batchId,
      grade: rawEntry.grade ? rawEntry.grade : 'Hyv.',
      credits: rawEntry.credits ? rawEntry.credits : course.credits,
      language: rawEntry.language ? rawEntry.language : course.language,
      attainmentDate: rawEntry.attainmentDate ? rawEntry.attainmentDate : date,
      graderId: grader.id,
      reporterId: reporterId,
      courseId: course.id,
      isOpenUni: false
    }
  })

  const rawEntryIds = await db.raw_entries.bulkCreate(rawEntries, {returning: true, transaction})
  logger.info({message: 'Raw entries success', amount: rawEntryIds.length, course: course.courseCode, batchId, sis: true})
  await processEntries(rawEntryIds, transaction)
  return true
}

module.exports = {
  processManualEntry
}
