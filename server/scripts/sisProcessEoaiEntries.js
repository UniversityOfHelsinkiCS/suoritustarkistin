const moment = require('moment')
const db = require('@models/index')
const logger = require('@utils/logger')
const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getEarlierAttainments } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { isValidHylHyvGrade, EAOI_CODES } = require('@root/utils/validators')
const { automatedAddToDb } = require('./automatedAddToDb')

const languageMap = {
  "fi_FI" : "fi",
  "en_US" : "en",
  "sv_SE" : "sv"
} 

const processEoaiEntries = async ({ grader }) => {
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

        if (!isValidHylHyvGrade(completion.grade)) {
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
          if (!isImprovedGrade(earlierAttainments, registration.onro, completion.grade)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: completion.grade,
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

    const result = await automatedAddToDb(matches, courses[0], batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processEoaiEntries
}