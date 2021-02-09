const moment = require('moment')
const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('@models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { EAOI_CODES } = require('@root/utils/validators')
const { getEarlierAttainments } = require('../services/importer')

const languageMap = {
  "fi_FI" : "fi",
  "en_US" : "en",
  "sv_SE" : "sv"
} 

const sisProcessEoaiEntries = async ({ grader }, transaction) => {
  try {
    const courses = await db.courses.findAll({ 
      where: {
        courseCode: EAOI_CODES
      },
      raw: true
    })

    const credits = await db.credits.findAll({
      where: {
        courseId: EAOI_CODES
      },
      raw: true
    })

    const rawRegistrations = await getMultipleCourseRegistrations(EAOI_CODES)
    const rawCompletions = await getCompletions('elements-of-ai')
    const rawEntries = await db.raw_entries.findAll({ where: { courseId: courses.map((c) => c.id) }})



    // There are so many completions and registrations for Eaoi-courses
    // that some cleaning should be done first, based on existing data
    const registrations = rawRegistrations.filter((registration) => {
      const earlierCredit = credits.find(
        (credit) =>
          credit.studentId === registration.onro
      )
      const earlierEntry = rawEntries.find(
        (entry) =>
          entry.studentNumber === registration.onro 
      )
      return (!earlierCredit && !earlierEntry)
    })

    const courseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: EAOI_CODES[0], studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const completions = rawCompletions.filter((completion) => {
      const earlierCredit = credits.find(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      )
      const earlierEntry = rawEntries.find(
        (entry) =>
          entry.moocCompletionId === completion.id ||
          entry.moocUserId === completion.user_upstream_id
      )
      return (!earlierCredit && !earlierEntry)
    })

    const batchId = `${EAOI_CODES[0]}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        if (!['fi_FI', 'en_US', 'sv_SE'].includes(completion.completion_language)) {
          return matches
        }

        const language = languageMap[completion.completion_language]
        const courseVersion = courses.find((c) => c.language === language)

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() === completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )

        if (registration && registration.onro) {
          if (!isImprovedGrade(earlierAttainments, registration.onro, 'Hyv.')) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: 'Hyv.',
              credits: courseVersion.credits,
              language: language,
              attainmentDate: completion.completion_date || date,
              graderId: grader.id,
              reporterId: null,
              courseId: courseVersion.id,
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

    logger.info(`${EAOI_CODES[0]}: Found ${matches.length} new completions.`)

    if (matches && matches.length > 0) {
      const newRawEntries = await db.raw_entries.bulkCreate(matches, {returning: true, transaction})
      const checkImprovements = false
      await processEntries(newRawEntries, transaction, checkImprovements)
    }
    return true

  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
  }
}

module.exports = {
  sisProcessEoaiEntries
}