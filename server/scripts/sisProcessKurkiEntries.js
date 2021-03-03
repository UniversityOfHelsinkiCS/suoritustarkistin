const moment = require('moment')
const { getCompletions } = require('../services/kurki')
const { getEarlierAttainments } = require('../services/importer')
const logger = require('@utils/logger')
const { isValidGrade, SIS_LANGUAGES } = require('@root/utils/validators')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { automatedAddToDb } = require('./automatedAddToDb')

const selectLanguage = (completion, course) => {
  const completionLanguage = completion.language
  const courseLanguage = course.language
  if (!completionLanguage) {
    return courseLanguage
  }
  if (completionLanguage && !SIS_LANGUAGES.includes(completionLanguage)) {
    return courseLanguage
  }
  return completionLanguage
}

const processKurkiEntries = async ({
  kurkiId,
  course,
  grader
}) => {
  try {
    const completions = await getCompletions(kurkiId)

    const courseStudentPairs = completions.reduce((pairs, completion) => {
      if (completion && completion.studentNumber) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: completion.studentNumber })
      } else {
        return pairs
      }
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise

        let grade = completion.grade

        if (grade === "-") {
          grade = 0
        }

        if (!isValidGrade(grade)) {
          logger.error({ message: `Invalid grade: ${completion.grade}`, sis: true })
          return matches
        }

        const language = selectLanguage(completion, course)

        if (completion && completion.studentNumber) {
          if (!isImprovedGrade(earlierAttainments, completion.studentNumber, completion.grade)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: completion.studentNumber,
              batchId: batchId,
              grade: grade,
              credits: completion.credits || course.credits,
              language: language,
              attainmentDate: completion.courseFinishDate || date,
              graderId: grader.id,
              reporterId: null,
              courseId: course.id
            })
          }
        } else {
          return matches
        }
      },
      []
    )
    logger.info({
      message: `${course.courseCode}: Found ${matches.length} new completions.`,
      sis: true
    })
  
    const result = await automatedAddToDb(matches, course, batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { error }
  }
}

module.exports = { 
  processKurkiEntries
}