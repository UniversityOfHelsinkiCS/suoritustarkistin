const getRegistrations = require('../services/eduweb')
const getCompletions = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('./sendEmail')

const isValidStudentId = (id) => {
  if (/^0\d{8}$/.test(id)) {
    // is a 9 digit number
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

const fixStudentId = (id) => {
  if (id.length === 8 && id[0] === '1' && isValidStudentId('0' + id)) {
    return '0' + id
  }
  for (let i = 0; i < id.length - 8; i++) {
    const candidate = id.substring(i, i + 9)
    if (candidate[0] === '0' && isValidStudentId(candidate)) {
      return candidate
    }
  }

  return null
}

const processOldCompletions = async (course) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: course
      },
      raw: true
    })
    const moocIdsInDb = credits.map((credit) => credit.moocId)
    const studentIdsInDb = credits.map((credit) => credit.studentId)

    const completions = await getCompletions(course)

    console.log('Raw completions:', completions.length)
    const unmarkedCompletionsWithStudentNumber = completions.filter(
      (completion) =>
        completion.student_number !== '' && !moocIdsInDb.includes(completion.id)
    )
    console.log(
      'Unmarked completions with some kind of studentId:',
      unmarkedCompletionsWithStudentNumber.length
    )

    const unmarkedCompletionsWithValidStudentNumber = unmarkedCompletionsWithStudentNumber.filter(
      (c) => {
        return isValidStudentId(c.student_number)
      }
    )
    console.log(
      'valid numbers',
      unmarkedCompletionsWithValidStudentNumber.length
    )

    const unmarkedCompletionsWithInvalidStudentNumber = unmarkedCompletionsWithStudentNumber.filter(
      (c) => {
        return !isValidStudentId(c.student_number)
      }
    )
    console.log(
      'invalid numbers',
      unmarkedCompletionsWithInvalidStudentNumber.length
    )
    const completionsAlmostToBeMarked = unmarkedCompletionsWithInvalidStudentNumber.reduce(
      (acc, curr) => {
        const fixedStudentNumber = fixStudentId(curr.student_number)
        if (fixedStudentNumber) {
          return acc.concat({ ...curr, student_number: fixedStudentNumber })
        }
        return acc
      },
      unmarkedCompletionsWithValidStudentNumber
    )

    const completionsToBeMarked = completionsAlmostToBeMarked.filter((c) => {
      return !studentIdsInDb.includes(c.student_number)
    })

    console.log('completionsToBeMarked:', completionsToBeMarked.length)
    console.log(completionsToBeMarked)
  } catch (error) {
    console.log('Error:', error.message)
  }
}

module.exports = processOldCompletions
