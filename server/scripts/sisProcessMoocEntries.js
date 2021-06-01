const moment = require('moment')
const db = require('@models/index')
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

const processMoocEntries = async ({
  job,
  course,
  grader
}) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: course.courseCode
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({
      where: {
        courseId: course.id
      }
    })

    const rawRegistrations = await getRegistrations(course.courseCode)
    const completions = await getCompletions(job.slug || course.courseCode)
    
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
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    logger.info({ message: `Found ${courseStudentPairs.length} students with no earlier completion in Suotar database` })

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = await completions.reduce(
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
          if (completion.grade && !isImprovedGrade(earlierAttainments, registration.onro, completion.grade)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: completion.grade || "Hyv.",
              credits: course.credits,
              language: language,
              attainmentDate: completion.completion_date || date,
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