const db = require('../models/index')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount,
  isValidCourseCode
} = require('../../utils/validators')
const { processEntries } = require('./processEntries')
const { getRegistrations } = require('../services/eduweb')
const logger = require('@utils/logger')
const { getBatchId } = require('@root/utils/common')


const LANGUAGES = ["fi", "sv", "en"]

const validateEntry = ({
  studentId,
  grade,
  credits,
  language,
  course
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
  if (course && !isValidCourseCode) {
    throw new Error(`'${course}' is not a valid course in Suotar'`)
  }
}

const processManualEntry = async ({
  graderId,
  reporterId,
  courseId,
  date,
  data
}, transaction) => {

  const originalCourse = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!originalCourse) throw new Error('Course does not exist.')

  let ayCourse = undefined
  let tktCourse = undefined

  if (originalCourse.autoSeparate) {
    const courses = originalCourse.courseCode.split('+')

    const firstCourse = courses[0] ? courses[0].trim() : undefined
    const secondCourse = courses[1] ? courses[1].trim() : undefined

    if (!firstCourse || !secondCourse) throw new Error('Erroneous coursecode for a combocourse') 

    ayCourse = await db.courses.findOne({
      where: {
        courseCode: firstCourse.startsWith('AY') ? firstCourse : secondCourse
      }
    })

    tktCourse = await db.courses.findOne({
      where: {
        courseCode: firstCourse.startsWith('AY') ? secondCourse : firstCourse
      }
    })

    if (!ayCourse) throw new Error('AY-version of the course is missing!')
    if (!tktCourse) throw new Error('TKT-version of the course is missing!')
  } else {
    tktCourse = originalCourse
  }

  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')

  const batchId = getBatchId(originalCourse.courseCode)

  const registrations = originalCourse.autoSeparate
    ? await getRegistrations([ayCourse.courseCode])
    : undefined

  const rawEntries = await Promise.all(data.map(async (rawEntry) => {
    await validateEntry(rawEntry)

    if (rawEntry.course) {
      tktCourse = await db.courses.findOne({
        where: {
          courseCode: rawEntry.course
        }
      })
      if (!tktCourse) throw new Error(`'${rawEntry.course}' is not a valid course code`)
    }

    // Separation for combo-courses
    // If the student has a registration to the Open uni -course,
    // they will be given a completion with an open university completion with AYXXXXXX -course code
    if (originalCourse.autoSeparate && registrations && registrations.find((r) => r.onro === rawEntry.studentId)) {
      return {
        studentNumber: rawEntry.studentId,
        batchId: batchId,
        grade: rawEntry.grade,
        credits: rawEntry.credits ? rawEntry.credits : ayCourse.credits,
        language: rawEntry.language ? rawEntry.language : ayCourse.language,
        attainmentDate: rawEntry.attainmentDate ? rawEntry.attainmentDate : date,
        graderId: grader.id,
        reporterId: reporterId,
        courseId: ayCourse.id
      }
    }

    // If there is no registration, a regular completion with TKTXXXXX -course code is given
    return {
      studentNumber: rawEntry.studentId,
      batchId: batchId,
      grade: rawEntry.grade,
      credits: rawEntry.credits ? rawEntry.credits : tktCourse.credits,
      language: rawEntry.language ? rawEntry.language : tktCourse.language,
      attainmentDate: rawEntry.attainmentDate ? rawEntry.attainmentDate : date,
      graderId: grader.id,
      reporterId: reporterId,
      courseId: tktCourse.id
    }
  }))

  const newRawEntries = await db.raw_entries.bulkCreate(rawEntries, { returning: true, transaction })

  logger.info({
    message: 'Raw entries created successfully',
    amount: newRawEntries.length,
    course: originalCourse.courseCode,
    batchId
  })
  const [failed, success, isMissingEnrollment] = await processEntries(newRawEntries)
  if (!failed.length) {
    await db.entries.bulkCreate(success, { transaction })
    logger.info({
      message: 'Entries success',
      amount: success.length
    })
    return { message: "success", success, failed, batchId, isMissingEnrollment, courseCode: originalCourse.courseCode }
  } else {
    return { message: "error", success, failed, batchId, courseCode: originalCourse.courseCode }
  }
}

module.exports = {
  processManualEntry
}
