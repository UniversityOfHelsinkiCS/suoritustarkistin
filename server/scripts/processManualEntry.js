const db = require('../models/index')
const { flatten } = require('lodash')
const { isValidStudentId, isValidGrade, isValidCreditAmount, isValidCourseCode } = require('../../utils/validators')
const { processEntries } = require('./processEntries')
const processExtraEntries = require('./processExtraEntries')
const logger = require('@utils/logger')
const { getBatchId } = require('@root/utils/common')

const LANGUAGES = ['fi', 'sv', 'en']

const validateEntry = ({ studentId, grade, credits, language, course }) => {
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

const processManualEntry = async ({ graderId, reporterId, courseId, date, data, isKandi }, transaction) => {
  const toRawEntry = async (rawEntry) => {
    await validateEntry(rawEntry)

    if (rawEntry.course) {
      course = await db.courses.findOne({
        where: {
          courseCode: rawEntry.course
        }
      })
      if (!course) throw new Error(`Course with course code '${rawEntry.course}' can not be found in Suotar`)
    }

    return {
      studentNumber: rawEntry.studentId,
      batchId: batchId,
      grade: rawEntry.grade,
      credits: rawEntry.credits ? rawEntry.credits : course.credits,
      language: rawEntry.language ? rawEntry.language : course.language,
      attainmentDate: rawEntry.attainmentDate ? rawEntry.attainmentDate : date,
      graderId: grader.id,
      reporterId: reporterId,
      courseId: course.id
    }
  }

  const courseCodes = data.map((rawEntry) => rawEntry.course)

  let course = {}

  if (courseId) {
    course = await db.courses.findOne({
      where: {
        id: courseId
      }
    })
  } else {
    course = await db.courses.findOne({
      where: {
        courseCode: courseCodes[0]
      }
    })
  }

  if (!course)
    throw new Error(
      'Course information missing! Check that you have given a default course or each completion has its own course'
    )

  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')

  const batchId = getBatchId(course.courseCode)

  const rawEntries = await Promise.all(data.filter(({ isExtra }) => !isExtra).map(toRawEntry))

  const extraRawEntries = await Promise.all(data.filter(({ isExtra }) => isExtra).map(toRawEntry))

  const newRawEntries = await db.raw_entries.bulkCreate(rawEntries, { returning: true, transaction })
  const newExtraRawEntries = await db.raw_entries.bulkCreate(flatten(extraRawEntries), { returning: true, transaction })

  logger.info({
    message: 'Raw entries created successfully',
    amount: newRawEntries.length,
    course: course.courseCode,
    batchId
  })
  const [failed, success, isMissingEnrollment] = await processEntries(newRawEntries, isKandi)
  const [failedExtras, successExtras] = await processExtraEntries(newExtraRawEntries, isKandi)
  if (!failed.length && !failedExtras.length) {
    await db.entries.bulkCreate(success, { transaction })
    await db.extra_entries.bulkCreate(successExtras, { transaction })
    logger.info({
      message: 'Entries success',
      amount: success.length + successExtras.length
    })
    return {
      message: 'success',
      success: success.concat(successExtras),
      failed: failed.concat(failedExtras),
      batchId,
      isMissingEnrollment,
      courseCode: course.courseCode
    }
  } else {
    return {
      message: 'error',
      success: success.concat(successExtras),
      failed: failed.concat(failedExtras),
      batchId,
      courseCode: course.courseCode
    }
  }
}

module.exports = {
  processManualEntry
}
