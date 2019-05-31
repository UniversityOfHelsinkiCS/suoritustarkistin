const db = require('../models/index')
const {
  isValidStudentId,
  isValidOodiDate,
  isValidGrade,
  isValidCreditAmount
} = require('../utils/validators')

const LANGUAGES = {
  fi: 1,
  en: 6
}

const shortDate = (date) => {
  const splitDate = date.split('.')
  return `${splitDate[0]}.${splitDate[1]}.${splitDate[2].substring(2)}`
}

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
  if (!isValidOodiDate(date)) {
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
