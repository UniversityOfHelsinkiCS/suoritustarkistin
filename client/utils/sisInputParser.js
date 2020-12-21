import * as CSV from 'csv-string'
import { isValidStudentId, isValidEmailAddress, isValidOodiDate } from 'Root/utils/validators'
import { sisIsValidDate, sisIsDateObject } from '../../utils/validators'

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

const formatDate = (date) => {
  if (!date) return undefined
  if (sisIsDateObject(date) && sisIsValidDate(date)) return date
  if (!sisIsDateObject(date) && isValidOodiDate(date)) {
    const parts = date.split('.')
    const newDay = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    return newDay
  }
  return date
}

export const parseCSV = (string) => {

  const addLeadingZero = (studentnumber) => {
    if (isValidStudentId(`0${studentnumber}`)) return `0${studentnumber}`
    return studentnumber
  }
  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const splitRow = row.split(CSV.detect(row))
    return {
      studentId: addLeadingZero(splitRow[0]),
      batchId: '',
      grade: splitRow[1],
      credits: splitRow[2],
      language: splitRow[3],
      attainmentDate: formatDate(splitRow[4]),
      graderId: '',
      reporterId: '',
      course: ''
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
