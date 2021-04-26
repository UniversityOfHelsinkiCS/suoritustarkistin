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
const { getRegistrations } = require('../services/eduweb')

const LANGUAGES = {
  fi: 1,
  sv: 2,
  en: 6
}

const ORGANISATION_RELATED_PARAMETERS = {
  AY: '#2#H930#11#93013#3##',
  TKT: '#2#H523#####',
  CSM: '#2#H523#####',
  BSCS: '#2#H500#####',
  MAT: '#2#H516#####'
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

  const orgParams = (courseCode) => {
    if (courseCode.substring(0, 2) === 'AY') {
      return ORGANISATION_RELATED_PARAMETERS.AY
    }
    if (courseCode.substring(0, 3) === 'TKT') {
      return ORGANISATION_RELATED_PARAMETERS.TKT
    }
    if (courseCode.substring(0, 3) === 'CSM') {
      return ORGANISATION_RELATED_PARAMETERS.CSM
    }
    if (courseCode.substring(0, 4) === 'BSCS') {
      return ORGANISATION_RELATED_PARAMETERS.BSCS
    }
    if (courseCode.substring(0, 3) === 'MAT') {
      return ORGANISATION_RELATED_PARAMETERS.MAT
    }
    throw new Error(`Unknown course organization ${courseCode}.`)
  }

  const registrations = course.autoSeparate
    ? await getRegistrations([`AY${course.courseCode}`])
    : undefined

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

      if (registrations && registrations.find((r) => r.onro === studentId)) {
        return `${studentId}##${
          LANGUAGES[language] || LANGUAGES[course.language]
        }#AY${course.courseCode}#${course.name}#${completionDate || date}#0#${
          grade || 'Hyv.'
        }#106##${grader.employeeId}${orgParams(`AY${course.courseCode}`)}${
          commify(credits) || course.credits
        }`
      }

      return `${studentId}##${
        LANGUAGES[language] || LANGUAGES[course.language]
      }#${course.courseCode}#${course.name}#${completionDate || date}#0#${
        grade || 'Hyv.'
      }#106##${grader.employeeId}${orgParams(course.courseCode)}${
        commify(credits) || course.credits
      }`
    })
    .join('\n')

  const savedReport = await db.reports.create({
    fileName: `${course.courseCode}%${moment().format(
      'DD.MM.YY-HHmmss'
    )}_MANUAL.dat`,
    data: report,
    graderId: grader.id,
    reporterId
  })

  sendEmail({
    subject: `Uusia kurssisuorituksia: ${course.courseCode}`,
    text: `Uusi siirtotiedosto luotu OodiTooliin kurssin ${course.name} (${course.courseCode}) manuaalisesti syötetystä datasta.`
  })
  logger.info({message: `New manual completions for course ${course.name} (${course.courseCode})`, courseCode: course.courseCode, amount: data.length, oodi: true})
  return savedReport
}

module.exports = {
  processManualEntry
}
