const db = require('@models/index')
const logger = require('@utils/logger')
const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getEarlierAttainments } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { automatedAddToDb } = require('./automatedAddToDb')
const { isImprovedGrade } = require('../utils/earlierCompletions')
const { EOAI_CODES } = require('@root/utils/validators')
const { getBatchId, moocLanguageMap, getMoocAttainmentDate } = require('@root/utils/common')

const processEoaiEntries = async ({ grader }, sendToSisu) => {
  try {
    const courses = await db.courses.findAll({ 
      where: {
        courseCode: EOAI_CODES
      },
      raw: true
    })

    const credits = await db.credits.findAll({
      where: {
        courseId: EOAI_CODES
      },
      raw: true
    })

    const rawRegistrations = await getMultipleCourseRegistrations(EOAI_CODES)
    const rawCompletions = await getCompletions('elements-of-ai')
    const rawEntries = await db.raw_entries.findAll({ where: { courseId: courses.map((c) => c.id) }})

    // There are so many completions and registrations for EOAI-courses
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
        return pairs.concat({ courseCode: EOAI_CODES[0], studentNumber: registration.onro })
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

    const batchId = getBatchId(EOAI_CODES[0])
    const date = new Date()

    let matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        if (!Object.keys(moocLanguageMap).includes(completion.completion_language)) {
          return matches
        }

        const language = moocLanguageMap[completion.completion_language]
        const courseVersion = courses.find((c) => c.language === language)

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() === completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )

        if (registration && registration.onro) {

          const attainmentDate = getMoocAttainmentDate(
            completion.completion_registration_attempt_date,
            completion.completion_date,
            date
          )

          if (!isImprovedGrade(earlierAttainments, registration.onro, "Hyv.", attainmentDate, courseVersion.credits)) {
            return matches
          } else if (matches.some((c) => c.studentNumber === registration.onro)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: "Hyv.",
              credits: courseVersion.credits,
              language: language,
              attainmentDate: attainmentDate,
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

    if (!matches) matches = []
    logger.info(`${EOAI_CODES[0]}: Found ${matches.length} new completions.`)

    const result = await automatedAddToDb(matches, courses[0], batchId, sendToSisu)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processEoaiEntries
}