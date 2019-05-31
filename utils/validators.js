const isValidStudentId = (id) => {
  if (/^0[12]\d{7}$/.test(id)) {
    // is a 9 digit number with leading 01 or 02
    const multipliers = [7, 1, 3, 7, 1, 3, 7]
    const checksum = id
      .substring(1, 8)
      .split('')
      .reduce((sum, curr, index) => {
        return (sum + curr * multipliers[index]) % 10
      }, 0)
    return (10 - checksum) % 10 == id[8]
  }
  return false
}

const isValidOodiDate = (date) =>
  /^(3[01]|[12][0-9]|[1-9])\.(1[0-2]|[1-9])\.20[0-9][0-9]$/.test(date) // valid format 29.5.2019

const isValidGrade = (grade) => /^([0-5]|Hyv\.|Hyl\.)$/.test(grade) // 0 to 5, Hyv. or Hyl.

const isValidCreditAmount = (credits) => /^[0-9]?[0-9],[05]$/.test(credits) // 0,0 to 99,5 in 0,5 steps

module.exports = {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount
}
