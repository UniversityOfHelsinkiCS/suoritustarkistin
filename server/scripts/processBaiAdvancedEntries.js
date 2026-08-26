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
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { passedAttainmentFound } = require('../utils/earlierCompletions')
const { fetchRegistrationsFor, courseStudentPairs, findByEmail, isUnidentified } = require('../utils/moocRegistrations')
const { sendSentryError } = require('../utils/sentry')
const { automatedAddToDb } = require('./automatedAddToDb')

const processBaiAdvancedEntries = async ({ job, course, grader }, sendToSisu = false) => {
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

    const registrations = await fetchRegistrationsFor(course.courseCode)
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

    const handled = new Set(
      advancedRawEntries
        .map((entry) => entry.studentNumber)
        .concat(rawCredits.filter((credit) => credit.tier === 3).map((credit) => credit.studentId))
    )
    const pending = registrations.persons.filter(({ studentNumber }) => !handled.has(studentNumber))

    const attainmentsForCodes = (codes) =>
      Promise.all(
        codes.map((courseCode) =>
          getEarlierAttainmentsWithoutSubstituteCourses(courseStudentPairs(pending, courseCode))
        )
      ).then((lists) => lists.flat())

    const advancedAttainments = await attainmentsForCodes(advancedCodes)
    const oldBaiAttainments = await attainmentsForCodes([OLD_BAI_CODE])

    const batchId = getBatchId(course.courseCode)
    const today = new Date()

    const toRawEntry = (completion, studentNumber, attainmentDate) => ({
      studentNumber,
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

    let unmatched = 0
    let unidentified = 0

    const matches = []
    for (const completion of completions) {
      const registration = findByEmail(registrations, completion.email)

      if (!registration) {
        if (isUnidentified(registrations, completion.email)) {
          unidentified += 1
          logger.info({
            message: `${course.courseCode}: Registration student number missing for ${completion.email}`
          })
        } else {
          unmatched += 1
        }
        continue
      }

      const { studentNumber } = registration
      if (handled.has(studentNumber)) continue

      const attainmentDate = getMoocAttainmentDate({
        registrationAttemptDate: completion.completion_registration_attempt_date,
        completionDate: completion.completion_date,
        today
      })

      const holdsAdvanced =
        passedAttainmentFound({ attainments: advancedAttainments, studentNumber, minCredits: 1 }) ||
        passedAttainmentFound({ attainments: oldBaiAttainments, studentNumber, minCredits: 2 })

      if (holdsAdvanced) {
        logger.info({ message: `Earlier attainment found for student ${studentNumber}` })
        continue
      }

      if (matches.some((match) => match.studentNumber === studentNumber)) continue

      matches.push(toRawEntry(completion, studentNumber, attainmentDate))
    }

    logger.info({
      message: `${course.courseCode}: ${completions.length} completions checked against ${pending.length} students${unmatched ? `, ${unmatched} matched no registered email` : ''}${unidentified ? `, ${unidentified} matched a registration without student number` : ''}`
    })
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    return await automatedAddToDb(matches, course, batchId, sendToSisu)
  } catch (error) {
    logger.error({ message: `Error processing new completions for ${course.courseCode}: ${error.message}` })
    sendSentryError('Processing bai advanced completions failed', error, {
      course: course.courseCode,
      jobId: job.id
    })
    return { message: error.message }
  }
}

module.exports = {
  processBaiAdvancedEntries
}
