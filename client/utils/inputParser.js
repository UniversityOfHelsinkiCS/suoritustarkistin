import { isValidStudentId, isValidEmailAddress } from 'Root/utils/validators'

export const parseCSV = (string) => {
  const addLeadingZero = (studentnumber) => {
    if (isValidStudentId(`0${studentnumber}`)) return `0${studentnumber}`
    return studentnumber
  }

  const rows = string.trim().split('\n')
  const data = rows.map((row) => {
    const splitRow = row.split(';')
    return {
      studentId: addLeadingZero(splitRow[0]),
      grade: splitRow[1],
      credits: splitRow[2],
      language: splitRow[3],
      completionDate: splitRow[4]
    }
  })
  return data
}

export const attachRegistrations = (data, registrations) => {
  if (!data) return null
  return data.map((row) => {
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
}

export const stripRegistrations = (data) => {
  if (!data) return null
  return data.map((row) => {
    return { ...row, registration: undefined }
  })
}
