import * as CSV from 'csv-string'
import { isValidStudentId, isValidEmailAddress } from 'Root/utils/validators'

const markDuplicates = (data) => {
  const indexes = data
    .map((row) => {
      return row.registration ? row.registration.onro : row.studentId
    })
    .reduce((acc, studentnumber, index, studentnumbers) => {
      const firstIndex = studentnumbers.indexOf(studentnumber)
      if (firstIndex === index) return acc
      if (acc.indexOf(firstIndex) < 0) return acc.concat([firstIndex, index])
      return acc.concat(index)
    }, [])

  return data.map((row, index) =>
    indexes.includes(index)
      ? { ...row, duplicate: true }
      : { ...row, duplicate: false }
  )
}

export const parseCSV = (string, newRawEntries, courses) => {
  const { courseId, graderEmployeeId, date } = newRawEntries
  const course = courses.find((c) => c.id === courseId)

  const addLeadingZero = (studentnumber) => {
    if (isValidStudentId(`0${studentnumber}`)) return `0${studentnumber}`
    return studentnumber
  }
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const splitRow = row.split(CSV.detect(row))
    return {
      studentNumber: addLeadingZero(splitRow[0]),
      batchId: courseId + date,
      grade: splitRow[1] ? splitRow[1] : 'Hyv.',
      credits: splitRow[2] ? splitRow[2] : course.credits,
      language: splitRow[3] ? splitRow[3] : course.language,
      attainmentDate: date,
      graderId: course.graderId,
      reporterId: graderEmployeeId,
      course: courseId
    }
  })
  return markDuplicates(data)
}

export const attachRegistrations = (data, registrations) => {
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
    })
  )
}

export const stripRegistrations = (data) => {
  if (!data) return null
  return markDuplicates(
    data.map((row) => {
      return { ...row, registration: undefined }
    })
  )
}
