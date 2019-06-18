const LANGUAGES = {
  fi: 1,
  en: 6
}

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

const isValidGrade = (grade) => /^([0-5]|Hyv\.|Hyl\.)$/.test(grade) // 0 to 5, Hyv. or Hyl.

const isValidCreditAmount = (credits) => /^[0-9]?[0-9],[05]$/.test(credits) // 0,0 to 99,5 in 0,5 steps

const isValidLanguage = (language) => !!LANGUAGES[language]

const isValidToken = (token) => token

const isValidRow = (row) => {
  if (!isValidStudentId(row.studentId)) {
    return false
  }
  if (row.grade && !isValidGrade(row.grade)) {
    return false
  }
  if (row.credits && !isValidCreditAmount(row.credits)) {
    return false
  }
  if (row.language && !isValidLanguage(row.language)) {
    return false
  }
  return true
}

const isValidReport = (report) => {
  if (!report.data) {
    return false
  }

  if (!isValidOodiDate(report.date)) {
    return false
  }

  if (!isValidToken(report.token)) {
    return false
  }
  let allRowsValid = true
  report.data.forEach((row) => {
    if (!isValidRow(row)) {
      allRowsValid = false
    }
  })
  if (!allRowsValid) {
    return false
  }

  return true
}

module.exports = {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage,
  isValidReport
}
