const db = require('@server/models/index')
const logger = require('@server/utils/logger')
const { getBatchId, getMoocAttainmentDate, OLD_BAI_CODE, OLD_BAI_INTERMEDIATE_CODE } = require('@shared/common')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { passedAttainmentFound } = require('../utils/earlierCompletions')
const { fetchRegistrationsFor, courseStudentPairs, findByEmail, isUnidentified } = require('../utils/moocRegistrations')
const { sendSentryError } = require('../utils/sentry')
const { automatedAddToDb } = require('./automatedAddToDb')

const processBaiIntermediateEntries = async ({ job, course, grader }, sendToSisu = false) => {
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

    const registrations = await fetchRegistrationsFor(course.courseCode)
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

    const handled = new Set(
      rawCredits.map((credit) => credit.studentId).concat(rawEntries.map((entry) => entry.studentNumber))
    )
    const pending = registrations.persons.filter(({ studentNumber }) => !handled.has(studentNumber))

    const earlierAttainments = (
      await Promise.all(
        courseCodes.map((courseCode) =>
          getEarlierAttainmentsWithoutSubstituteCourses(courseStudentPairs(pending, courseCode))
        )
      )
    ).flat()

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
    let alreadyAttained = 0

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

      if (passedAttainmentFound({ attainments: earlierAttainments, studentNumber, minCredits: 1 })) {
        alreadyAttained += 1
        continue
      }

      if (matches.some((match) => match.studentNumber === studentNumber)) continue

      matches.push(toRawEntry(completion, studentNumber, attainmentDate))
    }

    logger.info({
      message: `${course.courseCode}: ${completions.length} completions checked against ${pending.length} students${unmatched ? `, ${unmatched} matched no registered email` : ''}${unidentified ? `, ${unidentified} matched a registration without student number` : ''}${alreadyAttained ? `, ${alreadyAttained} already had an earlier attainment` : ''}`
    })
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    return await automatedAddToDb(matches, course, batchId, sendToSisu)
  } catch (error) {
    logger.error({ message: `Error processing new completions for ${course.courseCode}: ${error.message}` })
    sendSentryError('Processing bai intermediate completions failed', error, {
      course: course.courseCode,
      jobId: job.id
    })
    return { message: error.message }
  }
}

module.exports = {
  processBaiIntermediateEntries
}
