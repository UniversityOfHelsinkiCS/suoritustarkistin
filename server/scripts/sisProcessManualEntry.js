const moment = require('moment')
const db = require('../models/index')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount
} = require('../../utils/validators')
// const { getRegistrations } = require('../services/eduweb')

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

const processManualEntry = async ({
  graderId,
  reporterId,
  courseId,
  date,
  data
}) => {

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!course) throw new Error('Course id does not exist.')
  
  // TODO: Define how registrations are checked for MOOC-courses 
  /* const registrations = course.autoSeparate
    ? await getRegistrations([`AY${course.courseCode}`])
    : undefined
  */
  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')

  const batchId = `${course.courseCode}%${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  for (const entry of data) {
    validateEntry(entry)
    const entryObject = {
      studentNumber: entry.studentId,
      batchId: batchId,
      grade: entry.grade ? entry.grade : 'Hyv.',
      credits: entry.credits ? entry.credits : course.credits,
      language: entry.language ? entry.language : course.language,
      attainmentDate: entry.attainmentDate ? entry.attainmentDate : date,
      graderId: grader.id,
      reporterId: reporterId,
      course: course.id
    }
    await db.raw_entries.create(entryObject)
  }
  return true
}

module.exports = {
  processManualEntry
}
