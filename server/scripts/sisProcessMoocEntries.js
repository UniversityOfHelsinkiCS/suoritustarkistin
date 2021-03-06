const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const logger = require('@utils/logger')
const { sisIsValidGrade, SIS_LANGUAGES } = require('../../utils/validators')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { getEarlierAttainments } = require('../services/importer')
const { automatedAddToDb } = require('./automatedAddToDb')

const selectLanguage = (completion, course) => {
  const completionLanguage = completion.completion_language
  const courseLanguage = course.language
  if (!completionLanguage) {
    return courseLanguage
  }
  if (completionLanguage && !SIS_LANGUAGES.includes(completionLanguage)) {
    return courseLanguage
  }
  return completionLanguage
}

const defineGrade = (completion, course) => {
  const grade = completion.grade
  if (!grade && course.gradeScale === "sis-hyl-hyv") return "Hyv."
  if (!grade && course.gradeScale === "sis-0-5") return null
  if (!grade && !course.gradeScale) return "Hyv."
  return grade
}

const processMoocEntries = async ({
  job,
  course,
  grader
}) => {
  try {
    const registrations = await getRegistrations(course.courseCode)
    const completions = await getCompletions(job.slug || course.courseCode)

    const courseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    let matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise

        if (completion.grade && !sisIsValidGrade(completion.grade)) {
          return matches
        }

        const language = selectLanguage(completion, course)
        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() ===
              completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )

        if (registration && registration.onro) {
          const grade = defineGrade(completion, course)

          if (!grade) {
            return matches
          }
          if (!isImprovedGrade(earlierAttainments, registration.onro, grade, completion.completion_date, course.credits)) {
            return matches
          }
          if (matches.some((c) => c.studentNumber === registration.onro)) {
            return matches
          }
          return matches.concat({
            studentNumber: registration.onro,
            batchId: batchId,
            grade: grade,
            credits: course.credits,
            language: language,
            attainmentDate: completion.completion_date || date,
            graderId: grader.id,
            reporterId: null,
            courseId: course.id,
            moocUserId: completion.user_upstream_id,
            moocCompletionId: completion.id
          })
        } else {
          return matches
        }
      },
      []
    )

    if (!matches) matches = []
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })
    const result = await automatedAddToDb(matches, course, batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = { 
  processMoocEntries
}