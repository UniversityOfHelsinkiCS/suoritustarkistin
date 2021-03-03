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

const processMoocEntries = async ({
  job,
  course,
  grader
}, transaction) => {
  try {
    const registrations = await getRegistrations(course.courseCode)
    const completions = await getCompletions(job.slug || course.courseCode)


    const courseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise

        if (!isValidGrade(completion.grade)) {
          logger.error({
            message: `Invalid grade: ${completion.grade}`,
            sis: true
          })
          return matches
        }

        const language = selectLanguage(completion, course)
        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() ===
              completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )

        if (registration && registration.onro) {
          if (!isImprovedGrade(earlierAttainments, registration.onro, completion.grade)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: completion.grade,
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

    logger.info({
      message: `${course.courseCode}: Found ${matches.length} new completions.`,
      sis: true
    })

    if (matches && matches.length > 0) {
      const newRawEntries = await db.raw_entries.bulkCreate(matches, { returning: true })
      logger.info({
        message: `${matches.length} new raw entries created`,
        amount: newRawEntries.length,
        course: course.courseCode,
        batchId,
        sis: true
      })

      const checkImprovements = false
      const [failed, success] = await processEntries(newRawEntries, checkImprovements)

      if (failed.length) {
        logger.info({
          message: `${failed.length} entries failed`,
          sis: true
        })

        for (const failedEntry of failed) {
          logger.info({
            message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}`,
            sis: true
          })
          await db.raw_entries.destroy({
            where: {
              id: failedEntry.id
            }
          })
        }
      }

      if (success && success.length) {
        await db.entries.bulkCreate(success, { transaction })
        logger.info({
          message: `${success.length} new entries created`,
          amount: success.length,
          sis: true
        })
        return { message: "success" }
      }
    }

    return { message: "no new entries" }
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
  }
}

module.exports = { 
  processMoocEntries
}