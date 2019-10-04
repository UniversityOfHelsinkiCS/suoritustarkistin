const moment = require('moment')
const db = require('../models/index')
const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount
} = require('../../utils/validators')
const { commify } = require('../../utils/commify')
const logger = require('@utils/logger')

const sendEmail = require('../utils/sendEmail')

const LANGUAGES = {
  fi: 1,
  sv: 2,
  en: 6
}

const ORGANISATION_RELATED_PARAMETERS = {
  AYTKT: '#2#H930#11#93013#3##',
  TKT: '#2#H523#####'
}

const validateEntry = ({
  studentId,
  grade,
  credits,
  language,
  completionDate
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
  if (language && !LANGUAGES[language]) {
    throw new Error(`'${language}' is not valid language`)
  }
  if (completionDate && !isValidOodiDate(completionDate)) {
    throw new Error('Validation error in date.')
  }
}

const processManualEntry = async ({
  graderEmployeeId,
  reporterId,
  courseId,
  date,
  data
}) => {
  if (!isValidOodiDate(date)) {
    throw new Error('Validation error in date.')
  }

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!course) throw new Error('Course id does not exist.')

  const orgParams = (courseCode) =>
    courseCode.substring(0, 2) === 'AY'
      ? ORGANISATION_RELATED_PARAMETERS.AYTKT
      : ORGANISATION_RELATED_PARAMETERS.TKT
  const grader = await db.users.findOne({
    where: {
      employeeId: graderEmployeeId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')

  const report = data
    .map((entry) => {
      validateEntry(entry)
      const { studentId, grade, credits, language, completionDate } = entry
      return `${studentId}##${LANGUAGES[language] ||
        LANGUAGES[course.language]}#${course.courseCode}#${
        course.name
      }#${completionDate || date}#0#${grade || 'Hyv.'}#106##${
        grader.employeeId
      }${orgParams(course.courseCode)}${commify(credits) || course.credits}`
    })
    .join('\n')

  const savedReport = await db.reports.create({
    fileName: `${course.courseCode}%${moment().format(
      'DD.MM.YY-HHmmss'
    )}-V1-S2019.dat`,
    data: report,
    graderId: grader.id,
    reporterId
  })

  const info = await sendEmail(
    `Uusia kurssisuorituksia: ${course.courseCode}`,
    `Uusi siirtotiedosto luotu OodiTooliin kurssin ${course.name} (${
      course.courseCode
    }) manuaalisesti syötetystä datasta.`
  )
  if (info) {
    info.accepted.forEach((accepted) =>
      logger.info(`Email sent to ${accepted}.`)
    )
  } else if (info) {
    info.rejected.forEach((rejected) =>
      logger.error(`Address ${rejected} was rejected.`)
    )
  }

  return savedReport
}

module.exports = {
  processManualEntry
}
