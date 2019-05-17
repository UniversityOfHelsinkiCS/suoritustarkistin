const getRegistrations = require('../services/eduweb')
const getCompletions = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('./sendEmail')

const isValidStudentId = (id) => {
  return id.length === 9 && id.substring(0, 2) === '01'
}

const fixMoocIds = async (course) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        moocId: -1
      },
      raw: true
    })

    const completions = await getCompletions(course)

    const filteredCredits = credits.filter((credit) =>
      completions.map((c) => c.student_number).includes(credit.studentId)
    )
    console.log(filteredCredits.length, 'matches found from MOOC')
    const rFilteredCredits = credits.filter((credit) => {
      registrations.map((r) => r.onro).includes(credit.studentId)
    })
    console.log(rFilteredCredits.length, 'matches found from registrations')
  } catch (error) {
    console.log('Error:', error.message)
  }
}

module.exports = fixMoocIds
