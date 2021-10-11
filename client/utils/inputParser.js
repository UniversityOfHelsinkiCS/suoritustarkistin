import * as CSV from 'csv-string'
import * as _ from 'lodash'
import {
  isDateObject,
  isValidDate,
  isValidEmailAddress,
  isValidOodiDate,
  isValidStudentId
} from 'Root/utils/validators'


const markDuplicates = (data, defaultCourse) => {
  if (!data) return []
  const indexes = data
    .map((row, index) => {
      return {
        index,
        studentnumber: row.registration ? row.registration.onro : row.studentId,
        course: row.course.length ? row.course : defaultCourse
      }
    })

  let duplicates = []
  const grouped = _.groupBy(indexes, 'studentnumber')
  for (const [studentnumber, completions] of Object.entries(grouped)) {
    for (const { course, index } of completions) {
      if (completions.some((c) => c.course == course && c.index !== index)) {
        duplicates = [...duplicates, studentnumber]
      }
    }
  }

  return data.map((row) =>
    duplicates.includes(row.studentId)
      ? { ...row, duplicate: true }
      : { ...row, duplicate: false }
  )
}

const formatDate = (date) => {
  if (!date) return undefined
  if (isDateObject(date) && isValidDate(date)) {
    // Use 12 PM to avoid off by one day -errors in frontend
    const newDay = new Date(date.getYear(), date.getMonth() + 1, date.getDate(), 6)
    return newDay
  }
  if (!isDateObject(date) && isValidOodiDate(date)) {
    const parts = date.split('.')
    // Use 12 PM to avoid off by one day -errors in frontend
    const newDay = new Date(parts[2], Number(parts[1]) - 1, parts[0], 6)
    return newDay
  }
  return date.trim()
}

const formatGrade = (grade, defaultGrade) => {
  if (!grade && defaultGrade) return 'Hyv.'
  if (!grade) return undefined
  const trimmedGrade = grade.trim()
  if (['Hyv', 'hyv', 'hyv.', 'Hyv.'].includes(trimmedGrade)) return 'Hyv.'
  if (['Hyl', 'hyl', 'hyl.', 'Hyl.'].includes(trimmedGrade)) return 'Hyl.'
  return trimmedGrade
}

const addLeadingZero = (studentnumber) => {
  if (isValidStudentId(`0${studentnumber.trim()}`)) return `0${studentnumber}`
  return studentnumber
}

const toRawEntry = (studentId, grade, credits, language, attainmentDate, course) => ({
  studentId: addLeadingZero(studentId).trim(),
  batchId: '',
  grade: formatGrade(grade),
  credits: credits && credits.trim(),
  language: language && language.trim(),
  attainmentDate: formatDate(attainmentDate),
  graderId: '',
  reporterId: '',
  course: (course && course.trim()) || ''
})

export const parseCSV = (string, defaultCourse) => {
  if (!string) return []
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const [studentId, grade, credits, language, attainmentDate, course] = row.split(CSV.detect(row))
    return toRawEntry(studentId, grade, credits, language, attainmentDate, course)
  })
  return markDuplicates(data, defaultCourse)
}

const COURSE_CODE_MAP = {
  TKT50001: 'ÄIDINKIELINEN_VIESTINTÄ',
  TKT20014: 'KYPSYYSNÄYTE',
  TKT50002: 'TUTKIMUSTIEDONHAKU'
}

export const parseKandiCSV = (string, extraCourses) => {

  if (!string) return []
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const [studentId, grade, credits, language, attainmentDate, course, motherTongueLang, kypLang, researchLang] = row.split(CSV.detect(row))
    const extras = extraCourses
      .filter(({ courseCode }) => {
        // Filter out extras explicitly
        if (motherTongueLang === 'x' && COURSE_CODE_MAP[courseCode] === 'ÄIDINKIELINEN_VIESTINTÄ')
          return false
        if (kypLang === 'x' && COURSE_CODE_MAP[courseCode] === 'KYPSYYSNÄYTE')
          return false
        if (researchLang === 'x' && COURSE_CODE_MAP[courseCode] === 'TUTKIMUSTIEDONHAKU')
          return false

        // Filter out extras when kandi language is english
        // and extras lang not explicitly defined
        if (language === 'en' && COURSE_CODE_MAP[courseCode] === 'ÄIDINKIELINEN_VIESTINTÄ' && !motherTongueLang)
          return false
        if (language === 'en' && COURSE_CODE_MAP[courseCode] === 'KYPSYYSNÄYTE' && !kypLang)
          return false
        if (language === 'en' && COURSE_CODE_MAP[courseCode] === 'TUTKIMUSTIEDONHAKU' && !researchLang)
          return false

        return true
      })
      .map(({ courseCode }) => courseCode)
    return [toRawEntry(studentId, grade, credits, language, attainmentDate, course, extras)]
      .concat(extras
        .map((courseCode) => {
          let extraEntryLang = ''
          switch (COURSE_CODE_MAP[courseCode]) {
            case 'ÄIDINKIELINEN_VIESTINTÄ':
              extraEntryLang = motherTongueLang || language
              break
            case 'KYPSYYSNÄYTE':
              extraEntryLang = kypLang || language
              break
            case 'TUTKIMUSTIEDONHAKU':
              extraEntryLang = researchLang || language
              break
            default:
              extraEntryLang = language
          }

          return { ...toRawEntry(studentId, 'hyv', null, extraEntryLang, attainmentDate, courseCode), isExtra: true }
        })
      )
  })
  return markDuplicates(_.flatten(data))
}

export const attachRegistrations = (data, registrations, defaultCourse) => {
  if (!data) return null
  return markDuplicates(
    data.map((row) => {
      const cleanedEmail = row.studentId.trim().toLowerCase()
      if (isValidEmailAddress(cleanedEmail)) {
        const registration = registrations.find(
          (reg) =>
            reg.email.toLowerCase() === cleanedEmail ||
            reg.mooc.toLowerCase() === cleanedEmail
        )
        return { ...row, registration }
      }
      return { ...row, registration: undefined }
    }),
    defaultCourse
  )
}

export const stripRegistrations = (data, defaultCourse) => {
  if (!data) return null
  return markDuplicates(
    data.map((row) => {
      return { ...row, registration: undefined }
    }),
    defaultCourse
  )
}
