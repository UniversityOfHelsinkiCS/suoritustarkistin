const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./processEntry')
const { isValidGrade } = require('../../utils/validators')

const LANGUAGES = ["fi", "sv", "en"]

const isImprovement = (previousGrades, grade) => {
  if (!isValidGrade(grade)) return false
  const validGrades = ['Hyl.', 'Hyv.', '1', '2', '3', '4', '5']
  const betterOrSame = previousGrades.filter(
    (previousGrade) =>
      (validGrades.indexOf(previousGrade) || 0) >=
      (validGrades.indexOf(grade) || 0)
  )

  return betterOrSame.length === 0
}

const sisProcessMoocEntries = async ({
  graderId,
  reporterId,
  courseId,
  slug }, transaction) => {

  try {
  
    const course = await db.courses.findOne({
      where: {
        id: courseId
      }
    })

    if (!course) throw new Error('Course id does not exist.')

    const grader = await db.users.findOne({
      where: {
        employeeId: graderId
      }
    })
  
    if (!grader) throw new Error('Grader employee id does not exist.')

    const rawEntries = await db.raw_entries.findAll({})
    const registrations = await getRegistrations(course.courseCode)
    const completions = await getCompletions(slug || course.courseCode)

    const date = new Date()

    const batchId = `${course.courseCode}%${moment().format(
      'DD.MM.YY-HHmmss'
    )}`    

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        const previousGrades = rawEntries
          .filter(
            (entry) =>
              entry.moocCompletionId === completion.id ||
              entry.moocUserId === completion.user_upstream_id
          )
          .map((entry) => entry.grade)

        if (completion.grade) {
          if (!isValidGrade(completion.grade)) {
            logger.error(`Invalid grade: ${completion.grade}`)
            return matches
          }

          if (completion.completion_language && completion.completion_language !== "unknown"  && !LANGUAGES.includes(completion.completion_language)) {
            logger.error(`Invalid language: ${completion.language}`)
          }
          
          // TODO: Find a better way to check if there are already completions 
          // for the same course by the same student
          if (
            previousGrades.length > 0 &&
            !isImprovement(previousGrades, completion.grade)
          ) {
            return matches
          } 
        }

        if (!completion.grade && previousGrades.length > 0) {
          return matches
        }

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() ===
              completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )
        const date = new Date()

        if (registration && registration.onro) {
          return matches.concat({
            studentNumber: registration.onro,
            batchId: batchId,
            grade: completion.grade || 'Hyv.',
            credits: course.credits,
            language: course.language,
            attainmentDate: completion.completion_date || date,
            graderId: grader.id,
            reporterId: reporterId,
            courseId: course.id,
            isOpenUni: false,
            moocUserId: completion.user_upstream_id,
            moocCompletionId: completion.id,
          })
        } else {
          return matches
        }
      },
      []
    )

    logger.info(`${course.courseCode}: Found ${matches.length} new completions.`)

    const newRawEntries = await db.raw_entries.bulkCreate(matches, {returning: true, transaction})
    await processEntries(newRawEntries, transaction)
    return true

  } catch (error) {
    logger.error('Error processing new sis-mooc-completions:', error)
  }
}

module.exports = { 
  sisProcessMoocEntries
}
