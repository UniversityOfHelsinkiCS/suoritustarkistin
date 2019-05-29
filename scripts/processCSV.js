const db = require('../models/index')

const LANGUAGES = {
  fi: 1,
  en: 6
}

const shortDate = (date) => {
  const splitDate = date.split('.')
  return `${splitDate[0]}.${splitDate[1]}.${splitDate[2].substring(2)}`
}

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

const isValidDate = (date) =>
  /^(3[01]|[12][0-9]|[1-9])\.(1[0-2]|[1-9])\.20[0-9][0-9]$/.test(date)
const isValidGrade = (grade) => /^([0-5]|Hyv\.)$/.test(grade)
const isValidCreditAmount = (credits) => /^[0-9]?[0-9],[05]$/.test(credits)

const isValidRow = (row) => {
  if (!isValidStudentId(row[0])) {
    return false
  }
  if (row[1] && !isValidGrade(row[1])) {
    return false
  }
  if (row[2] && !isValidCreditAmount(row[2])) {
    return false
  }
  if (row[3] && !LANGUAGES[row[3]]) {
    return false
  }

  return true
}

const processCSV = async (data, courseId, graderId, date) => {
  if (!isValidDate(date)) {
    throw new Error('Error in date.')
  }

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  const grader = await db.graders.findOne({
    where: {
      id: graderId
    }
  })

  const splitData = data.trim().split('\n')
  const report = splitData
    .map((row) => {
      const splitRow = row.split(';')
      if (isValidRow(splitRow)) {
        return `${splitRow[0]}##${LANGUAGES[splitRow[3]] ||
          LANGUAGES[course.language]}#${course.courseCode}#${
          course.name
        }#${date}#0#${splitRow[1] || 'Hyv.'}#106##${
          grader.identityCode
        }#1#H930#11#93013#3##${splitRow[2] || course.credits}`
      } else {
        throw new Error(`Validation error in row "${row}"`)
      }
    })
    .join('\n')

  const savedReport = await db.reports.create({
    fileName: `${course.courseCode}%${shortDate(date)}-V1-S2019.dat`,
    data: report
  })

  return savedReport
}

module.exports = processCSV
