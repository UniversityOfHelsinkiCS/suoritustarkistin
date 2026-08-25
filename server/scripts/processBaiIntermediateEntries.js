const db = require('@server/models/index')
const logger = require('@server/utils/logger')
const { getBatchId, getMoocAttainmentDate, OLD_BAI_CODE, OLD_BAI_INTERMEDIATE_CODE } = require('@shared/common')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { earlierBaiCompletionFound } = require('../utils/earlierCompletions')
const { automatedAddToDb } = require('./automatedAddToDb')

const processBaiIntermediateEntries = async ({ job, course, grader }, sendToSisu) => {
  try {
    const courseCodes = [course.courseCode, OLD_BAI_CODE, OLD_BAI_INTERMEDIATE_CODE]

    const rawCredits = await db.credits.findAll({
      where: {
        courseId: courseCodes
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({
      where: {
        '$course.courseCode$': courseCodes
      },
      include: [{ model: db.courses, as: 'course' }]
    })

    const registrations = await getRegistrations(course.courseCode)
    const registeredIncluded = true
    const rawCompletions = await getCompletions(job.slug || course.courseCode, registeredIncluded)

    const alreadyHandled = (completion) =>
      rawCredits.some(
        (credit) => credit.completionId === completion.id || credit.moocId === completion.user_upstream_id
      ) ||
      rawEntries.some(
        (entry) => entry.moocCompletionId === completion.id || entry.moocUserId === completion.user_upstream_id
      )

    const completions = rawCompletions.filter((completion) => {
      if (![2, 3].includes(Number(completion.tier))) return false
      return !alreadyHandled(completion)
    })

    const studentPairsFor = (courseCode) =>
      registrations
        .filter((registration) => registration && registration.onro)
        .map((registration) => ({ courseCode, studentNumber: registration.onro }))

    const earlierAttainments = (
      await Promise.all(
        courseCodes.map((courseCode) => getEarlierAttainmentsWithoutSubstituteCourses(studentPairsFor(courseCode)))
      )
    ).flat()

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

      if (earlierBaiCompletionFound(earlierAttainments, registration.onro, attainmentDate)) {
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
  processBaiIntermediateEntries
}
