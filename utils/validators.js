const moment = require('moment')
const cron = require('node-cron')

const SIS_LANGUAGES = [
  "fi",
  "sv",
  "en"
]

const NEW_EOAI_CODE = ['TKT21018']
const EOAI_CODES = ['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv']
const ALL_EOAI_CODES = ['TKT21018', 'AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv']

const EOAI_NAMEMAP = {
  en: {
    name: 'The Elements of AI',
    code: 'AYTKT21018'
  },
  fi: {
    name: 'Elements of AI: Tekoälyn perusteet',
    code: 'AYTKT21018fi'
  },
  sv: {
    name: 'Elements of AI: Grunderna i artificiell intelligens',
    code: 'AYTKT21018sv'
  }
}

const NEW_BAI_INTERMEDIATE_CODE = 'TKT210281'
const NEW_BAI_ADVANCED_CODE = 'TKT210282'

const BAI_INTERMEDIATE_CODE = 'AYTKT210281en'
const BAI_ADVANCED_CODE = 'AYTKT210282en'

const OLD_BAI_CODE = 'AYTKT21028en'
const OLD_BAI_INTERMEDIATE_CODE = 'AYTKT210281en'
const OLD_BAI_ADVANCED_CODE = 'AYTKT210282en'


const isValidStudentId = (id) => {
  if (/^0[12]\d{7}$/.test(id)) {
    // is a 9 digit number with leading 01 or 02
    const multipliers = [7, 1, 3, 7, 1, 3, 7]
    const checksum = id
      .substring(1, 8)
      .split('')
      .reduce((sum, curr, index) => (sum + curr * multipliers[index]) % 10, 0)
    return (10 - checksum) % 10 == id[8]
  }
  return false
}

const isValidOodiDate = (date) =>
  /^(3[01]|[12][0-9]|[1-9])\.(1[0-2]|[1-9])\.20[0-9][0-9]$/.test(date) // valid format 29.5.2019


const isValidDate = (date) => {
  if (!date) return false
  if (isDateObject(date)) {
    if (date.getFullYear() > 1999 && date.getFullYear() < 2099) return true
  }
  return false
}

const isFutureDate = (date) => {
  if (!date) return false
  if (isDateObject(date)) {
    if (date > new Date()) return true
  }
  return false
}

const isPastDate = (date) => {
  if (!date) return false
  if (isDateObject(date)) {
    if (date < moment().subtract(100, 'days')) return 'past'
  }
  return false
}

const isDateObject = (date) => {
  return Object.prototype.toString.call(date) === "[object Date]"
}

const isValidGrade = (grade) => /^(|-|[0-5]|Hyv\.|Hyl\.)$/.test(grade) // -, 0 to 5, Hyv. or Hyl.

const isValidHylHyvGrade = (grade) => /^(|Hyv\.|Hyl\.)$/.test(grade) // Hyv. or Hyl.

const isValidCreditAmount = (credits) => /^[0-9]?[0-9](,[05])?$/.test(credits) // 0,0 to 99,5 in 0,5 steps, including natural numbers

const isValidEmailAddress = (address) =>
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(
    address
  )

const isValidHYCourseCode = (courseCode) =>
  /^(TKT|BSCS|CSM|MAT|DATA)[A-Za-z0-9-]{3,6}$/.test(courseCode)

const isValidCourseCode = (courseCode) => isValidHYCourseCode(courseCode)

const areValidGraders = (graders) => {
  if (!Array.isArray(graders)) return false
  if (!graders.every((grader) => typeof grader === 'number')) return false
  return true
}

const isValidGradeScale = (gradeScale) => {
  if (gradeScale && !['sis-0-5', 'sis-hyl-hyv'].includes(gradeScale)) return false
  return true
}

const isValidCourse = (course) => {
  if (course.autoSeparate && !isValidCourseCode(course.courseCode))return false
  if (!isValidCourseCode(course.courseCode)) return false
  if (!course.name) return false
  if (!isValidLanguage(course.language)) return false
  if (!isValidCreditAmount(course.credits)) return false
  if (!areValidGraders(course.graders)) return false
  if (!isValidGradeScale(course.gradeScale)) return false
  return true
}

const isValidLanguage = (language) => {
  return (SIS_LANGUAGES.includes(language))
}

const isValidRow = (row, date) => {
  if (row.duplicate) return false
  if (!isValidStudentId(row.studentId)) return false
  if (row.grade && !isValidGrade(row.grade)) return false
  if (row.credits && !isValidCreditAmount(row.credits)) return false
  if (row.language && !isValidLanguage(row.language)) return false
  if ((row.attainmentDate && !isValidDate(row.attainmentDate) && !isValidOodiDate(row.attainmentDate)) || (!row.attainmentDate && !isValidDate(date))) return false
  return true
}

const areValidNewRawEntries = (rawEntries) => {
  if (!rawEntries) return false
  if (!rawEntries.graderId || !rawEntries.courseId) return false
  if (!rawEntries.data) return false
  let allRowsValid = true
  rawEntries.data.forEach((row) => {
    if (!isValidRow(row, rawEntries.date)) {
      allRowsValid = false
    }
  })
  if (!allRowsValid) return false
  return true
}


const isValidJob = (job) => {
  if (!isValidSchedule(job.schedule)) return false
  if (!job.courseId) return false
  return true
}

const isValidSchedule = (schedule) => {
  return cron.validate(schedule)
}

module.exports = {
  NEW_EOAI_CODE,
  EOAI_CODES,
  ALL_EOAI_CODES,
  EOAI_NAMEMAP,
  BAI_INTERMEDIATE_CODE,
  BAI_ADVANCED_CODE,
  NEW_BAI_INTERMEDIATE_CODE,
  NEW_BAI_ADVANCED_CODE,
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE,
  SIS_LANGUAGES,
  isValidStudentId,
  isValidOodiDate,
  isValidDate,
  isDateObject,
  isFutureDate,
  isPastDate,
  isValidGrade,
  isValidHylHyvGrade,
  isValidCreditAmount,
  isValidLanguage,
  isValidEmailAddress,
  areValidNewRawEntries,
  isValidCourse,
  isValidHYCourseCode,
  isValidCourseCode,
  isValidJob,
  isValidSchedule
}
