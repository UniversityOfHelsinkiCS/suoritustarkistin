const logger = require('@utils/logger')
const { isValidGrade, SIS_LANGUAGES } = require('@root/utils/validators')
const { getBatchId, moocLanguageMap, getMoocAttainmentDate } = require('@root/utils/common')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/newMooc')
const { getEarlierAttainments } = require('../services/importer')
const { isImprovedGrade } = require('../utils/earlierCompletions')
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
  if (grade === "1" && scale === "sis-hyv-hyl") return "Hyv."
  if (!grade && course.gradeScale === 'sis-0-5') return null
  if (grade === "0" && scale === "sis-hyv-hyl") return null
  if (!grade && !course.gradeScale) return 'Hyv.'
  return grade
}

const processNewMoocEntries = async ({ job, course, grader }, sendToSisu = false) => {
  try {
    const registrations = await getRegistrations(course.courseCode)
    const completions = await getCompletions(job.slug || course.courseCode)

    const courseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      }
      return pairs
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const batchId = getBatchId(course.courseCode)
    const date = new Date()

    let matches = await completions.reduce(async (matchesPromise, completion) => {
      const matches = await matchesPromise

      if (completion.grade.grade && !isValidGrade(completion.grade.grade)) {
        return matches
      }

      const language = selectLanguage(completion, course)
      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() === completion.email.toLowerCase() ||
          registration.mooc.toLowerCase() === completion.email.toLowerCase()
      )

      if (registration && registration.onro) {
        const grade = defineGrade(completion, course)

        const attainmentDate = getMoocAttainmentDate({
          registrationAttemptDate: completion.completion_registration_attempt_date,
          completionDate: completion.completion_date,
          today: date,
          useManualCompletionDate: job.useManualCompletionDate,
          courseCode: course.courseCode
        })

        if (!grade) {
          return matches
        }
        if (
          !isImprovedGrade(earlierAttainments, registration.onro, grade, completion.completion_date, course.credits)
        ) {
          return matches
        }
        if (matches.some((c) => c.studentNumber === registration.onro)) {
          return matches
        }
        return matches.concat({
          studentNumber: registration.onro,
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
      if (registration && !registration.onro)
        logger.info({
          message: `${course.courseCode}: Registration student number missing for ${registration.email}`
        })
      return matches
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
  processNewMoocEntries
}
