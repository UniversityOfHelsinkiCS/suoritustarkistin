const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isValidGrade, SIS_LANGUAGES } = require('../../utils/validators')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')

const selectLanguage = (completion, course) => {
  const completionLanguage = completion.completion_language
  const courseLanguage = course.language
  if (!completionLanguage) {
    return courseLanguage
  }
  if (completionLanguage && !SIS_LANGUAGES.includes(completionLanguage)) {
    return courseLanguage
  }
  return completionLanguage
}

const sisProcessMoocEntries = async ({
  graderId,
  courseId,
  slug
}, transaction) => {

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!course) logger.error({ message: 'Course id does not exist.', sis: true })

  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) logger.error({ message: 'Grader employee id does not exist.', sis: true })

  const registrations = await getRegistrations(course.courseCode)
  const completions = await getCompletions(slug || course.courseCode)
  const batchId = `${course.courseCode}%${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  const date = new Date()
  const matches = await completions.reduce(
    async (matchesPromise, completion) => {
      const matches = await matchesPromise

      if (completion.grade) {
        if (!isValidGrade(completion.grade)) {
          logger.error({ message: `Invalid grade: ${completion.grade}`, sis: true })
          return matches
        }
      }

      const language = selectLanguage(completion, course)
      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() ===
            completion.email.toLowerCase() ||
          registration.mooc.toLowerCase() === completion.email.toLowerCase()
      )
      if (registration && registration.onro) {
        if (!await isImprovedGrade(course.courseCode, registration.onro, completion.grade)) {
          return matches
        } else {
          return matches.concat({
            studentNumber: registration.onro,
            batchId: batchId,
            grade: completion.grade || 'Hyv.',
            credits: course.credits,
            language: language,
            attainmentDate: completion.completion_date || date,
            graderId: grader.id,
            reporterId: null,
            courseId: course.id,
            isOpenUni: false,
            moocUserId: completion.user_upstream_id,
            moocCompletionId: completion.id
          })
        }
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

}

module.exports = { 
  sisProcessMoocEntries
}
