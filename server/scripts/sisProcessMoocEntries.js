const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isValidGrade } = require('../../utils/validators')

const LANGUAGES = ["fi", "sv", "en"]

const isImprovement = (previousGrades, grade) => {
  if (!isValidGrade(grade)) return false
  const validGrades = ['Hyl.', 'Hyv.', '1', '2', '3', '4', '5']
  const betterOrSame = previousGrades.filter(
    (previousGrade) =>
      (validGrades.indexOf(previousGrade) || 0) >=
      (validGrades.indexOf(grade) || 0)
  )

  return betterOrSame.length === 0
}

const selectLanguage = (completion, course) => {
  const completionLanguage = completion.completion_language
  const courseLanguage = course.language
  if (!completionLanguage) {
    return courseLanguage
  }
  if (completionLanguage && !LANGUAGES.includes(completionLanguage)) {
    logger.error({message: `Invalid language: ${completionLanguage}`, sis: true})
    return courseLanguage
  }
  return completionLanguage
}

const sisProcessMoocEntries = async ({
  graderId,
  courseId,
  slug
}, transaction) => {

  const course = await db.courses.findOne({
    where: {
      id: courseId
    }
  })

  if (!course) throw new Error('Course id does not exist.')

  const credits = await db.credits.findAll({
    where: {
      courseId: course.courseCode
    },
    raw: true
  })

  const grader = await db.users.findOne({
    where: {
      employeeId: graderId
    }
  })

  if (!grader) throw new Error('Grader employee id does not exist.')
  const rawEntries = await db.raw_entries.findAll({})
  const registrations = await getRegistrations(course.courseCode)
  const completions = await getCompletions(slug || course.courseCode)
  const batchId = `${course.courseCode}%${moment().format(
    'DD.MM.YY-HHmmss'
  )}`

  const date = new Date()
  const matches = await completions.reduce(
    async (matchesPromise, completion) => {
      const matches = await matchesPromise
      // TODO: Find a better way to check if there are already completions 
      // for the same course by the same student
      const previousGradesAfterSis = rawEntries
        .filter(
          (entry) =>
            entry.moocCompletionId === completion.id ||
            entry.moocUserId === completion.user_upstream_id
        )
        .map((entry) => entry.grade)
      
      const previousGradesBeforeSis = credits
        .filter(
          (credit) =>
            credit.completionId === completion.id ||
            credit.moocId === completion.user_upstream_id
        )
        .map((credit) => credit.grade)

      const previousGrades = [...previousGradesAfterSis, ...previousGradesBeforeSis ]

      if (completion.grade) {
        if (!isValidGrade(completion.grade)) {
          logger.error({message: `Invalid grade: ${completion.grade}`, sis: true})
          return matches
        }

        if (
          previousGrades.length > 0 &&
          !isImprovement(previousGrades, completion.grade)
        ) {
          return matches
        } 
      }
      if (!completion.grade && previousGrades.length > 0) {
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
        return matches.concat({
          studentNumber: registration.onro,
          batchId: batchId,
          grade: completion.grade || 'Hyv.',
          credits: course.credits,
          language: language,
          attainmentDate: completion.completion_date || date,
          graderId: grader.id,
          reporterId: null,
          courseId: course.id,
          isOpenUni: false,
          moocUserId: completion.user_upstream_id,
          moocCompletionId: completion.id
        })
      } else {
        return matches
      }
    },
    []
  )
  logger.info(`${course.courseCode}: Found ${matches.length} new completions.`)
  const newRawEntries = await db.raw_entries.bulkCreate(matches, {returning: true, transaction})
  await processEntries(newRawEntries, transaction)
  return true

}

module.exports = { 
  sisProcessMoocEntries
}
