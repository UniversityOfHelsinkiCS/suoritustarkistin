const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isValidGrade, SIS_LANGUAGES } = require('../../utils/validators')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { getEarlierAttainments } = require('../services/importer')

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
  const completions = await getCompletions(job.slug || course.courseCode)
  const batchId = `${course.courseCode}-${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  const courseStudentPairs = registrations.reduce((pairs, registration) => {
    if (registration && registration.onro) {
      return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
    } else {
      return pairs
    }
  }, [])

  const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

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
        if (!isImprovedGrade(earlierAttainments, registration.onro, completion.grade)) {
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
  logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.`, sis: true })
  const checkImprovements = false

  if (matches && matches.length > 0) {
    const newRawEntries = await db.raw_entries.bulkCreate(matches, { returning: true, transaction })
    logger.info({ message: 'Raw entries success', amount: newRawEntries.length, course: course.courseCode, batchId, sis: true })

    const [failed, success] = await processEntries(newRawEntries, transaction, checkImprovements)
    if (failed.length) {
      logger.info({ message: `${failed.length} entries failed`, sis:true })
      for (const failedEntry of failed) {
        logger.info({ message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}`})
      }
    }

    if (success && success.length) {
      await db.entries.bulkCreate(success, { transaction })
      logger.info({ message: 'Entries success', amount: success.length, sis: true })
    }
  }
  return true
}

module.exports = { 
  sisProcessMoocEntries
}
