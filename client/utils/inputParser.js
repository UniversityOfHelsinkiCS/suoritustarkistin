/* eslint-disable no-restricted-syntax */
import * as CSV from 'csv-string'
import * as _ from 'lodash'
import { isDateObject, isValidDate, isValidOodiDate, isValidStudentId } from 'Root/utils/validators'
import { KANDI_EXTRA_COURSES } from 'Root/utils/common'

const markDuplicates = (data, defaultCourse) => {
  if (!data) return []
  const indexes = data.map((row, index) => ({
    index,
    studentnumber: row.studentId,
    course: row.course.length ? row.course : defaultCourse
  }))

  let duplicates = []
  const grouped = _.groupBy(indexes, 'studentnumber')
  for (const [studentnumber, completions] of Object.entries(grouped)) {
    for (const { course, index } of completions) {
      if (completions.some((c) => c.course === course && c.index !== index)) {
        duplicates = [...duplicates, studentnumber]
      }
    }
  }

  return data.map((row) =>
    duplicates.includes(row.studentId) ? { ...row, duplicate: true } : { ...row, duplicate: false }
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

const toRawEntry = (studentId, grade, credits, language, attainmentDate, course, uid) => ({
  studentId: addLeadingZero(studentId).trim(),
  batchId: '',
  grade: formatGrade(grade),
  credits: credits && credits.trim(),
  language: language && language.trim(),
  attainmentDate: formatDate(attainmentDate),
  graderId: '',
  reporterId: '',
  course: course ? course.trim() : '',
  uid
})

export const parseCSV = (string, defaultCourse) => {
  if (!string) return []
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const [studentId, grade, credits, language, attainmentDate, course, uid] = row.split(CSV.detect(row))
    return toRawEntry(studentId, grade, credits, language, attainmentDate, course, uid)
  })
  return markDuplicates(data, defaultCourse)
}

export const parseExtraCSV = (string, defaultCourse) => {
  if (!string) return []
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const [studentId, grade, credits, language, attainmentDate, course] = row.split(CSV.detect(row))
    return { ...toRawEntry(studentId, grade, credits, language, attainmentDate, course), isExtra: true }
  })
  return markDuplicates(data, defaultCourse)
}

export const parseKandiCSV = (string, extraCourses = []) => {
  if (!string) return []
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const [studentId, grade, credits, language, attainmentDate, motherTongueLang, kypLang, researchLang] = row.split(
      CSV.detect(row)
    )
    const extras = !['0', 'hyl.', 'hyl'].includes((grade || '').toLowerCase())
      ? extraCourses
          .filter(({ courseCode }) => {
            // Filter out extras explicitly
            if (motherTongueLang === 'x' && KANDI_EXTRA_COURSES[courseCode] === 'ÄIDINKIELINEN_VIESTINTÄ') return false
            if (kypLang === 'x' && KANDI_EXTRA_COURSES[courseCode] === 'KYPSYYSNÄYTE') return false
            if (researchLang === 'x' && KANDI_EXTRA_COURSES[courseCode] === 'TUTKIMUSTIEDONHAKU') return false

            // Filter out extras when kandi language is english
            // and extras lang not explicitly defined
            if (language === 'en' && KANDI_EXTRA_COURSES[courseCode] === 'ÄIDINKIELINEN_VIESTINTÄ' && !motherTongueLang)
              return false
            if (language === 'en' && KANDI_EXTRA_COURSES[courseCode] === 'KYPSYYSNÄYTE' && !kypLang) return false
            if (language === 'en' && KANDI_EXTRA_COURSES[courseCode] === 'TUTKIMUSTIEDONHAKU' && !researchLang)
              return false

            return true
          })
          .map(({ courseCode }) => courseCode)
      : []
    return [toRawEntry(studentId, grade, credits, language, attainmentDate)].concat(
      extras.map((courseCode) => {
        let extraEntryLang = ''
        switch (KANDI_EXTRA_COURSES[courseCode]) {
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
