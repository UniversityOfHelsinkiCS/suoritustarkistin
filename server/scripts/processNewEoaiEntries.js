const db = require('@models/index')
const logger = require('@utils/logger')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainments } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { isImprovedGrade } = require('../utils/earlierCompletions')
const { ALL_EOAI_CODES, NEW_EOAI_CODE } = require('@root/utils/validators')
const { automatedAddToDb } = require('./automatedAddToDb')
const { getBatchId, getMoocAttainmentDate } = require('@root/utils/common')


const languageMap = {
  "fi_FI" : "fi",
  "en_US" : "en",
  "sv_SE" : "sv"
} 

const processNewEoaiEntries = async ({ course, grader }) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: ALL_EOAI_CODES
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': ALL_EOAI_CODES
      },
      include: [
        { model: db.courses, as: 'course' }
      ]
    })

    const rawRegistrations = await getRegistrations(NEW_EOAI_CODE)
    const rawCompletions = await getCompletions('elements-of-ai')

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
        return pairs.concat({ courseCode: NEW_EOAI_CODE, studentNumber: registration.onro })
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

    const batchId = getBatchId(NEW_EOAI_CODE)
    const date = new Date()

    let matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        if (!['fi_FI', 'en_US', 'sv_SE'].includes(completion.completion_language)) {
          return matches
        }

        const language = languageMap[completion.completion_language]

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

          if (!isImprovedGrade(earlierAttainments, registration.onro, "Hyv.", attainmentDate, course.credits)) {
            return matches
          } else if (matches.some((c) => c.studentNumber === registration.onro)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: "Hyv.",
              credits: course.credits,
              language: language,
              attainmentDate: attainmentDate,
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

    if (!matches) matches = []
    logger.info(`${NEW_EOAI_CODE}: Found ${matches.length} new completions.`)

    const result = await automatedAddToDb(matches, course, batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processNewEoaiEntries
}