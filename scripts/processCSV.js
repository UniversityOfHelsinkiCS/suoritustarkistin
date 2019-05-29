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
  if (/^0\d{8}$/.test(id)) {
    // is a 9 digit number with leading 0
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

const isValidRow = (splitRow) => {
  if (!isValidStudentId(splitRow[0])) {
    return false
  }
  if (
    splitRow[1] &&
    (splitRow[1].length != 1 ||
      isNaN(splitRow[1]) ||
      splitRow[1] < 0 ||
      splitRow[1] > 5)
  ) {
    return false
  }
  if (splitRow[2] && !LANGUAGES[splitRow[2]]) {
    return false
  }

  return true
}

const processCSV = async (data, courseId, graderId, date) => {
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

  const splitData = data.split('\n')
  const report = splitData
    .map((row) => {
      const splitRow = row.split(',')
      if (isValidRow(splitRow)) {
        return `${splitRow[0]}##${LANGUAGES[splitRow[2]] ||
          LANGUAGES[course.language]}#${course.courseCode}#${
          course.name
        }#${date}#0#${splitRow[1] || 'Hyv.'}#106##${
          grader.identityCode
        }#1#H930#11#93013#3##${course.credits}`
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
