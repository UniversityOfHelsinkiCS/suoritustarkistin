const moment = require('moment')
const { Op } = require("sequelize")
const db = require('../models/index')
const {
  isValidStudentId,
  sisIsValidGrade,
  isValidCreditAmount
} = require('../../utils/validators')
const { processEntries } = require('./sisProcessEntry')
const { getRegistrations } = require('../services/eduweb')
const logger = require('@utils/logger')
const sendEmail = require('../utils/sendEmail')
const emailFactory = require('../utils/emailFactory')


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
  if (grade && !sisIsValidGrade(grade)) {
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


  const originalCourse = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!originalCourse) throw new Error('Course does not exist.')

  let ayCourse = undefined
  let tktCourse = undefined

  if (originalCourse.autoSeparate) {
    ayCourse = await db.courses.findOne({
      where: {
        courseCode: `AY${originalCourse.courseCode}`
      }
    })

    tktCourse = await db.courses.findOne({
      where: {
        [Op.and]: [
          { courseCode: originalCourse.courseCode },
          { autoSeparate: !true }
        ]
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

  const batchId = `${originalCourse.courseCode}-${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  const registrations = originalCourse.autoSeparate
    ? await getRegistrations([ayCourse.courseCode])
    : undefined

  const rawEntries = data.map((rawEntry) => {
    validateEntry(rawEntry)
    validateCourse(originalCourse.courseCode)

    // Separation for combo-courses
    // If the student has a registration to the Open uni -course,
    // they will be given a completion with an open university completion with AYXXXXXX -course code
    if (registrations && registrations.find((r) => r.onro === rawEntry.studentId)) {
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
  })

  const newRawEntries = await db.raw_entries.bulkCreate(rawEntries, { returning: true, transaction })
  const checkImprovements = true
  logger.info({
    message: 'Raw entries created successfully',
    amount: newRawEntries.length,
    course: originalCourse.courseCode,
    batchId,
    sis: true
  })
  const [failed, success] = await processEntries(newRawEntries, transaction, checkImprovements)
  if (!failed.length) {
    await db.entries.bulkCreate(success, { transaction })
    logger.info({
      message: 'Entries success',
      amount: success.length,
      sis: true
    })
    const info = await sendEmail(
      `Uusia kurssisuorituksia: ${originalCourse.courseCode}`,
      null,
      null,
      emailFactory(success.length, 0, originalCourse.courseCode)
    )
    if (info) {
      if (info.accepted.length) info.accepted.forEach((sent) => logger.info(`Email sent to ${sent}`))
      if (info.rejected.length) info.rejected.forEach((notSent) => logger.info(`Address ${notSent} was rejected`))
    }
    return { message: "success", success, failed }
  } else {
    return { message: "error", success, failed }
  }
}

module.exports = {
  processManualEntry
}
