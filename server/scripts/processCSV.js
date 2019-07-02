const db = require('../models/index')
const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount
} = require('../../utils/validators')
const { commify } = require('../../utils/commify')

const sendEmail = require('../utils/sendEmail')

const LANGUAGES = {
  fi: 1,
  sv: 2,
  en: 6
}

const ORGANISATION_RELATED_PARAMETERS = {
  AYTKT: '#1#H930#11#93013#3##',
  TKT: '#1#H523#####'
}

const shortDate = (date) => {
  const splitDate = date.split('.')
  return `${splitDate[0]}.${splitDate[1]}.${splitDate[2].substring(2)}`
}

const validateEntry = ({ studentId, grade, credits, language }) => {
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
}

const processManualEntry = async ({ graderId, courseId, date, data }) => {
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
  const grader = await db.graders.findOne({
    where: {
      id: graderId
    }
  })

  if (!grader) throw new Error('Grader id does not exist.')

  const report = data
    .map((entry) => {
      validateEntry(entry)
      const { studentId, grade, credits, language } = entry
      return `${studentId}##${LANGUAGES[language] ||
        LANGUAGES[course.language]}#${course.courseCode}#${
        course.name
      }#${date}#0#${grade || 'Hyv.'}#106##${grader.identityCode}${orgParams(
        course.courseCode
      )}${commify(credits) || course.credits}`
    })
    .join('\n')

  const savedReport = await db.reports.create({
    fileName: `${course.courseCode}%${shortDate(date)}-V1-S2019.dat`,
    data: report
  })

  const info = await sendEmail(
    `Uusia kurssisuorituksia: ${course.courseCode}`,
    `Uusi siirtotiedosto luotu OodiTooliin kurssin ${course.name} (${
      course.courseCode
    }) manuaalisesti syötetystä datasta.`
  )
  if (info) {
    info.accepted.forEach((accepted) =>
      console.log(`Email sent to ${accepted}.`)
    )
  } else if (info) {
    info.rejected.forEach((rejected) =>
      console.log(`Address ${rejected} was rejected.`)
    )
  }

  return savedReport
}

module.exports = {
  processManualEntry
}
