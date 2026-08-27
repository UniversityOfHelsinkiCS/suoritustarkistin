const db = require('@server/models/index')
const logger = require('@server/utils/logger')
const { getBatchId, moocLanguageMap, getMoocAttainmentDate, ALL_EOAI_CODES, NEW_EOAI_CODE } = require('@shared/common')
const { getEarlierAttainments } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { fetchRegistrationsFor, courseStudentPairs, findByEmail, isUnidentified } = require('../utils/moocRegistrations')
const { isImprovedGrade } = require('../utils/earlierCompletions')
const { sendSentryError } = require('../utils/sentry')
const { automatedAddToDb } = require('./automatedAddToDb')

const processEoaiEntries = async ({ course, grader }, sendToSisu) => {
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
      include: [{ model: db.courses, as: 'course' }]
    })

    const registrations = await fetchRegistrationsFor(NEW_EOAI_CODE)
    const rawCompletions = await getCompletions('elements-of-ai')

    // There are so many completions and registrations for EOAI-courses that some cleaning
    // should be done first, based on existing data. Checked again in the matching loop:
    // dropping a student here only keeps them out of the importer request, their emails
    // still resolve through findByEmail.
    const handled = new Set(
      credits.map((credit) => credit.studentId).concat(rawEntries.map((entry) => entry.studentNumber))
    )
    const pending = registrations.persons.filter(({ studentNumber }) => !handled.has(studentNumber))

    let unmatched = 0
    let unidentified = 0
    let alreadyAttained = 0

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs(pending, NEW_EOAI_CODE))

    const completions = rawCompletions.filter((completion) => {
      const earlierCredit = credits.find(
        (credit) => credit.completionId === completion.id || credit.moocId === completion.user_upstream_id
      )
      const earlierEntry = rawEntries.find(
        (entry) => entry.moocCompletionId === completion.id || entry.moocUserId === completion.user_upstream_id
      )
      return !earlierCredit && !earlierEntry
    })

    const batchId = getBatchId(NEW_EOAI_CODE)
    const date = new Date()

    let matches = await completions.reduce(async (matchesPromise, completion) => {
      const matches = await matchesPromise
      if (!Object.keys(moocLanguageMap).includes(completion.completion_language)) {
        return matches
      }

      const language = moocLanguageMap[completion.completion_language]

      const registration = findByEmail(registrations, completion.email)

      if (registration) {
        if (handled.has(registration.studentNumber)) {
          return matches
        }

        const attainmentDate = getMoocAttainmentDate({
          registrationAttemptDate: completion.completion_registration_attempt_date,
          completionDate: completion.completion_date,
          today: date
        })

        if (!isImprovedGrade(earlierAttainments, registration.studentNumber, 'Hyv.', attainmentDate, course.credits)) {
          alreadyAttained += 1
          return matches
        }
        if (matches.some((c) => c.studentNumber === registration.studentNumber)) {
          return matches
        }
        return matches.concat({
          studentNumber: registration.studentNumber,
          batchId,
          grade: 'Hyv.',
          credits: course.credits,
          language,
          attainmentDate,
          graderId: grader.id,
          reporterId: null,
          courseId: course.id,
          moocUserId: completion.user_upstream_id,
          moocCompletionId: completion.id
        })
      }
      if (isUnidentified(registrations, completion.email)) {
        unidentified += 1
        logger.info({
          message: `${NEW_EOAI_CODE}: Registration student number missing for ${completion.email}`
        })
      } else {
        unmatched += 1
      }
      return matches
    }, [])

    if (!matches) matches = []
    logger.info({
      message: `${NEW_EOAI_CODE}: ${completions.length} completions checked against ${pending.length} students${unmatched ? `, ${unmatched} matched no registered email` : ''}${unidentified ? `, ${unidentified} matched a registration without student number` : ''}${alreadyAttained ? `, ${alreadyAttained} already had an earlier attainment` : ''}`
    })
    logger.info({ message: `${NEW_EOAI_CODE}: Found ${matches.length} new completions.` })

    const result = await automatedAddToDb(matches, course, batchId, sendToSisu)
    return result
  } catch (error) {
    logger.error({ message: `Error processing new completions for ${NEW_EOAI_CODE}: ${error.message}` })
    sendSentryError('Processing eoai completions failed', error, { course: NEW_EOAI_CODE })
    return { message: error.message }
  }
}

module.exports = {
  processEoaiEntries
}
