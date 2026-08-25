const db = require('@server/models/index')
const logger = require('@server/utils/logger')
const {
  OLD_BAI_CODE,
  OLD_BAI_INTERMEDIATE_CODE,
  OLD_BAI_ADVANCED_CODE,
  NEW_BAI_INTERMEDIATE_CODE,
  getBatchId,
  getMoocAttainmentDate
} = require('@shared/common')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { automatedAddToDb } = require('./automatedAddToDb')
const { advancedFound } = require('../utils/earlierCompletions')

const processBaiAdvancedEntries = async ({ job, course, grader }, sendToSisu) => {
  logger.info({ message: `Processing BAI Advanced entries for course: ${course.courseCode}` })
  try {
    const rawCredits = await db.credits.findAll({
      where: {
        courseId: OLD_BAI_CODE
      },
      raw: true
    })

    const advancedCodes = [course.courseCode, OLD_BAI_ADVANCED_CODE]
    const intermediateCodes = [NEW_BAI_INTERMEDIATE_CODE, OLD_BAI_INTERMEDIATE_CODE]

    const advancedRawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': advancedCodes
      },
      include: [{ model: db.courses, as: 'course' }]
    })

    const intermediateRawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': intermediateCodes
      },
      include: [{ model: db.courses, as: 'course' }]
    })

    const registeredIncluded = true

    const registrations = await getRegistrations(course.courseCode)
    const rawCompletions = await getCompletions(job.slug || course.courseCode, registeredIncluded)

    const isSameCompletion = (entry, completion) =>
      entry.moocCompletionId === completion.id || entry.moocUserId === completion.user_upstream_id

    const creditsFor = (completion) =>
      rawCredits.filter(
        (credit) => credit.completionId === completion.id || credit.moocId === completion.user_upstream_id
      )

    const hasIntermediate = (completion) =>
      intermediateRawEntries.some((entry) => isSameCompletion(entry, completion)) ||
      creditsFor(completion).some((credit) => credit.tier === 2)

    const hasAdvanced = (completion) =>
      advancedRawEntries.some((entry) => isSameCompletion(entry, completion)) ||
      creditsFor(completion).some((credit) => credit.tier === 3)

    const completions = rawCompletions.filter((completion) => {
      if (Number(completion.tier) !== 3) return false
      return hasIntermediate(completion) && !hasAdvanced(completion)
    })

    const studentPairsFor = (courseCode) =>
      registrations
        .filter((registration) => registration && registration.onro)
        .map((registration) => ({ courseCode, studentNumber: registration.onro }))

    const [oldBaiAttainments, oldAdvancedAttainments, newAdvancedAttainments] = await Promise.all(
      [OLD_BAI_CODE, OLD_BAI_ADVANCED_CODE, course.courseCode].map((courseCode) =>
        getEarlierAttainmentsWithoutSubstituteCourses(studentPairsFor(courseCode))
      )
    )
    const advancedAttainments = oldAdvancedAttainments.concat(newAdvancedAttainments)

    const batchId = getBatchId(course.courseCode)
    const today = new Date()

    const matchesEmail = (registration, email) =>
      registration.email.toLowerCase() === email.toLowerCase() ||
      registration.mooc.toLowerCase() === email.toLowerCase()

    const toRawEntry = (completion, registration, attainmentDate) => ({
      studentNumber: registration.onro,
      batchId,
      grade: 'Hyv.',
      credits: 1,
      language: 'en',
      attainmentDate,
      graderId: grader.id,
      reporterId: null,
      courseId: course.id,
      moocUserId: completion.user_upstream_id,
      moocCompletionId: completion.id
    })

    const matches = []
    for (const completion of completions) {
      const registration = registrations.find((registration) => matchesEmail(registration, completion.email))
      if (!registration) continue

      if (!registration.onro) {
        logger.info({
          message: `${course.courseCode}: Registration student number missing for ${registration.email}`
        })
        continue
      }

      const attainmentDate = getMoocAttainmentDate({
        registrationAttemptDate: completion.completion_registration_attempt_date,
        completionDate: completion.completion_date,
        today
      })

      if (advancedFound(advancedAttainments, oldBaiAttainments, registration.onro, attainmentDate)) {
        logger.info({ message: `Earlier attainment found for student ${registration.onro}` })
        continue
      }

      if (matches.some((match) => match.studentNumber === registration.onro)) continue

      matches.push(toRawEntry(completion, registration, attainmentDate))
    }

    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    return await automatedAddToDb(matches, course, batchId, sendToSisu)
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processBaiAdvancedEntries
}
