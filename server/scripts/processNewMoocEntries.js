const logger = require('@server/utils/logger')
const { isValidGrade, SIS_LANGUAGES } = require('@shared/validators')
const { getBatchId, moocLanguageMap, getMoocAttainmentDate } = require('@shared/common')
const { getCompletions } = require('../services/newMooc')
const { getEarlierAttainments } = require('../services/importer')
const { fetchRegistrationsFor, courseStudentPairs, findByEmail, isUnidentified } = require('../utils/moocRegistrations')
const { isImprovedGrade } = require('../utils/earlierCompletions')
const { sendSentryError } = require('../utils/sentry')
const { automatedAddToDb } = require('./automatedAddToDb')

const selectLanguage = (completion, course) => {
  const completionLanguage = completion.completion_language

  const courseLanguage = course.language
  if (!completionLanguage) {
    return courseLanguage
  }

  if (completionLanguage && Object.keys(moocLanguageMap).includes(completionLanguage)) {
    return moocLanguageMap[completionLanguage]
  }

  if (completionLanguage && !SIS_LANGUAGES.includes(completionLanguage)) {
    return courseLanguage
  }

  return completionLanguage
}

const defineGrade = (completion, course) => {
  const { grade, scale } = completion.grade
  if (!grade && course.gradeScale === 'sis-hyl-hyv') return 'Hyv.'
  if (grade === '1' && scale === 'sis-hyv-hyl') return 'Hyv.'
  if (!grade && course.gradeScale === 'sis-0-5') return null
  if (grade === '0' && scale === 'sis-hyv-hyl') return null
  if (!grade && !course.gradeScale) return 'Hyv.'
  return grade
}

const processNewMoocEntries = async ({ job, course, grader }, sendToSisu = false) => {
  try {
    const registrations = await fetchRegistrationsFor(course.courseCode)
    const completions = await getCompletions(job.slug || course.courseCode)

    // A completion nobody claims is the failure mode worth seeing: the student
    // finished the course but none of their registered emails match the mooc
    // account. Counted here because the matching loop below only sees hits.
    let unmatched = 0
    let unidentified = 0

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs(registrations.persons, course.courseCode))

    const batchId = getBatchId(course.courseCode)
    const date = new Date()

    let matches = await completions.reduce(async (matchesPromise, completion) => {
      const matches = await matchesPromise

      if (completion.grade.grade && !isValidGrade(completion.grade.grade)) {
        return matches
      }

      const language = selectLanguage(completion, course)
      const registration = findByEmail(registrations, completion.email)

      if (registration) {
        const grade = defineGrade(completion, course)

        const attainmentDate = getMoocAttainmentDate({
          registrationAttemptDate: completion.completion_registration_attempt_date,
          completionDate: completion.completion_date,
          today: date,
          useManualCompletionDate: job.useManualCompletionDate
        })

        if (!grade) {
          return matches
        }
        if (
          !isImprovedGrade(
            earlierAttainments,
            registration.studentNumber,
            grade,
            completion.completion_date,
            course.credits
          )
        ) {
          return matches
        }
        if (matches.some((c) => c.studentNumber === registration.studentNumber)) {
          return matches
        }
        return matches.concat({
          studentNumber: registration.studentNumber,
          batchId,
          grade,
          credits: course.credits,
          language,
          attainmentDate,
          graderId: grader.id,
          reporterId: null,
          courseId: course.id,
          moocUserId: completion.user_id,
          newMoocCompletionId: completion.id
        })
      }
      if (isUnidentified(registrations, completion.email)) {
        unidentified += 1
        logger.info({
          message: `${course.courseCode}: Registration student number missing for ${completion.email}`
        })
      } else {
        unmatched += 1
      }
      return matches
    }, [])

    if (!matches) matches = []
    logger.info({
      message: `${course.courseCode}: ${completions.length} completions checked against ${registrations.persons.length} students${unmatched ? `, ${unmatched} matched no registered email` : ''}${unidentified ? `, ${unidentified} matched a registration without student number` : ''}`
    })
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })
    const result = await automatedAddToDb(matches, course, batchId, sendToSisu)
    return result
  } catch (error) {
    logger.error({ message: `Error processing new completions for ${course.courseCode}: ${error.message}` })
    sendSentryError('Processing new mooc completions failed', error, { course: course.courseCode, jobId: job.id })
    return { message: error.message }
  }
}

module.exports = {
  processNewMoocEntries
}
