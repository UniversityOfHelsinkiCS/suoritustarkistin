const db = require('@models/index')
const logger = require('@utils/logger')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { automatedAddToDb } = require('./automatedAddToDb')
const { advancedFound } = require('../utils/earlierCompletions')
const {
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE,
  NEW_BAI_INTERMEDIATE_CODE,
  getBatchId,
  getMoocAttainmentDate
} = require('@root/utils/common')

const processBaiAdvancedEntries = async ({ job, course, grader }, sendToSisu) => {
  try {
    const rawCredits = await db.credits.findAll({
      where: {
        courseId: OLD_BAI_CODE
      },
      raw: true
    })

    // Find all the already existing entries for the Advanced-courses, summer 2021 -one and the current one
    const advancedRawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': [course.courseCode, OLD_BAI_ADVANCED_CODE]
      },
      include: [{ model: db.courses, as: 'course' }]
    })

    // Find all the already existing entries for the Intermediate-courses, summer 2021 -one and the current one
    const intermediateRawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': [NEW_BAI_INTERMEDIATE_CODE, OLD_BAI_INTERMEDIATE_CODE]
      },
      include: [{ model: db.courses, as: 'course' }]
    })

    const registeredIncluded = true

    const registrations = await getRegistrations(course.courseCode)
    const rawCompletions = await getCompletions(job.slug || course.courseCode, registeredIncluded)

    // Pre-filter the completions to avoid overloading importer with thousands of completions
    const completions = rawCompletions.filter((completion) => {
      if (!completion.tier === Number(3)) return false

      const previousCredits = rawCredits.filter(
        (credit) => credit.completionId === completion.id || credit.moocId === completion.user_upstream_id
      )

      const previousIntermediateCredit = previousCredits.filter((credit) => credit.tier === 2)
      const previousAdvancedCredit = previousCredits.filter((credit) => credit.tier === 3)

      const previousAdvancedEntries = advancedRawEntries.filter(
        (entry) => entry.moocCompletionId === completion.id || entry.moocUserId === completion.user_upstream_id
      )

      const previousIntermediateEntries = intermediateRawEntries.filter(
        (entry) => entry.moocCompletionId === completion.id || entry.moocUserId === completion.user_upstream_id
      )

      // Check that the student has intermediate completion or old bai credit with 1 op already
      // and does NOT have an earlier advanced course completion
      return (
        (previousIntermediateEntries.length !== 0 || previousIntermediateCredit.length !== 0) &&
        previousAdvancedEntries.length === 0 &&
        previousAdvancedCredit.length === 0
      )
    })

    const oldBaiPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: OLD_BAI_CODE, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldAdvancedPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: OLD_BAI_ADVANCED_CODE, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const advancedPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldBaiAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(oldBaiPairs)
    const oldAdvancedAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(oldAdvancedPairs)
    const newAdvancedAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(advancedPairs)
    const advancedAttainments = oldAdvancedAttainments.concat(newAdvancedAttainments)

    const batchId = getBatchId(course.courseCode)
    const date = new Date()

    let matches = await completions.reduce(async (matchesPromise, completion) => {
      const matches = await matchesPromise

      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() === completion.email.toLowerCase() ||
          registration.mooc.toLowerCase() === completion.email.toLowerCase()
      )
      if (registration && registration.onro) {
        const attainmentDate = getMoocAttainmentDate({
          registrationAttemptDate: completion.completion_registration_attempt_date,
          completionDate: completion.completion_date,
          today: date,
          courseCode: course.courseCode
        })

        // Check that the student does not have Advanced course completion yet
        if (await advancedFound(advancedAttainments, oldBaiAttainments, registration.onro, attainmentDate)) {
          logger.info({ message: `Earlier attainment found for student ${registration.onro}` })
          return matches
        } else if (matches.some((c) => c.studentNumber === registration.onro)) {
          return matches
        } else {
          return matches.concat({
            studentNumber: registration.onro,
            batchId: batchId,
            grade: 'Hyv.',
            credits: 1,
            language: 'en',
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
    }, [])

    if (!matches) matches = []
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    const result = await automatedAddToDb(matches, course, batchId, sendToSisu)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processBaiAdvancedEntries
}
