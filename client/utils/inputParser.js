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
        studentnumber : row.registration ? row.registration.onro : row.studentId, 
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
    const newDay = new Date(date.getYear(), date.getMonth()+1, date.getDate(), 6)
    return newDay
  }
  if (!isDateObject(date) && isValidOodiDate(date)) {
    const parts = date.split('.')
    // Use 12 PM to avoid off by one day -errors in frontend
    const newDay = new Date(parts[2], Number(parts[1])-1, parts[0], 6)
    return newDay
  }
  return date.trim()
}

const formatGrade = (grade, defaultGrade) => {
  if (!grade && defaultGrade) return 'Hyv.'
  if (!grade) return undefined
  const trimmedGrade = grade.trim()
  if (trimmedGrade === 'Hyv' || trimmedGrade === 'hyv' || trimmedGrade === 'hyv.') return 'Hyv.'
  if (trimmedGrade === 'Hyl' || trimmedGrade === 'hyl' || trimmedGrade === 'hyl.') return 'Hyl.'
  return trimmedGrade
}

export const parseCSV = (string, defaultCourse) => {
  const addLeadingZero = (studentnumber) => {
    if (isValidStudentId(`0${studentnumber.trim()}`)) return `0${studentnumber}`
    return studentnumber
  }
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const splitRow = row.split(CSV.detect(row))
    return {
      studentId: addLeadingZero(splitRow[0]).trim(),
      batchId: '',
      grade: formatGrade(splitRow[1]),
      credits: splitRow[2] && splitRow[2].trim(),
      language: splitRow[3] && splitRow[3].trim(),
      attainmentDate: formatDate(splitRow[4]),
      graderId: '',
      reporterId: '',
      course: (splitRow[5] && splitRow[5].trim()) || ''
    }
  })
  return markDuplicates(data, defaultCourse)
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
