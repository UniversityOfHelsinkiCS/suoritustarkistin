const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { sisGetCompletions } = require('../services/pointsmooc')
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
  job,
  course,
  grader
}, transaction) => {

  const registrations = await getRegistrations(course.courseCode)
  const completions = await sisGetCompletions(job.slug || course.courseCode)
  const batchId = `${course.courseCode}-${moment().format(
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

      // Remember to change the grade, once the gradeScale-issue has been solved
      if (registration && registration.onro) {
        if (!await isImprovedGrade(course.courseCode, registration.onro, completion.grade)) {
          return matches
        } else {
          const grade = (completion.grade && completion.grade !== 'Hyv.') ? completion.grade : 1

          return matches.concat({
            studentNumber: registration.onro,
            batchId: batchId,
            grade: grade,
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
logger.info({message: `${course.courseCode}: Found ${matches.length} new completions.`, sis: true})
  if (matches && matches.length > 0) {
    const newRawEntries = await db.raw_entries.bulkCreate(matches, { returning: true, transaction })
    logger.info({message: 'Raw entries success', amount: newRawEntries.length, course: course.courseCode, batchId, sis: true})
    const checkImprovements = false
    await processEntries(newRawEntries, transaction, checkImprovements)
  }
  return true
}

module.exports = { 
  sisProcessMoocEntries
}
