const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('@models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isValidHylHyvGrade } = require('../../utils/validators')
const { isImprovedTier } = require('../utils/sisEarlierCompletions')
const { getEarlierAttainments } = require('../services/importer')

const tierCreditAmount = { 1: 0, 2: 1, 3: 2 }

const isTierUpgrade = (previousEntries, previousCredits, completion) => {
  if (!completion.tier || completion.tier === 1) return false
  if (previousCredits && previousCredits.includes(completion.tier)) return false
  if (previousEntries && previousEntries.includes(completion.tier - 1)) return false
  return true
}

const processBaiEntries = async ({
  job,
  course,
  grader
}, transaction) => {
  try {
    const rawCredits = await db.credits.findAll({
      where: {
        courseId: course.courseCode
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({ 
      where: {
        courseId: course.id 
      }
    })

    const registrations = await getRegistrations(course.courseCode)
    const rawCompletions = await getCompletions(job.slug)

    // If a completion with same or more credits if found, the new 
    // completion won't replace it
    const completions = rawCompletions.filter((completion) => {
      const previousCredits = rawCredits.filter(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      ).map((credit) => credit.tier)
      const previousEntries = rawEntries.filter(
        (entry) =>
          entry.moocCompletionId === completion.id ||
          entry.moocUserId === completion.user_upstream_id
      ).map((entry) => entry.credits)

      return (isTierUpgrade(previousEntries, previousCredits, completion))
    })

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

        if (!isValidHylHyvGrade(completion.grade)) {
          logger.error({ message: `Invalid grade: ${completion.grade}`, sis: true })
          return matches
        }

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() === completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )
        // Once the gradeScale has been fixed, remember to change the grade to "Hyv."
        if (registration && registration.onro) {
          if (!await isImprovedTier(earlierAttainments, registration.onro, tierCreditAmount[completion.tier])) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: completion.grade,
              credits: tierCreditAmount[completion.tier],
              language: 'en',
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
        logger.info({ message: `${failed.length} entries failed`, sis:true })
  
        for (const failedEntry of failed) {
          logger.info({ message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}`})
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
  processBaiEntries
}