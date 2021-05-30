const moment = require('moment')
const logger = require('@utils/logger')
const { SIS_LANGUAGES, sisIsValidGrade } = require('@root/utils/validators')
const { getCompletions, postTransferredId } = require('../services/kurki')
const { getEarlierAttainments } = require('../services/importer')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { automatedAddToDb } = require('./automatedAddToDb')
const { inProduction } = require('@utils/common')

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

    if (!completions) {
      logger.error({ message: `No frozen completions were found for the course ${kurkiId}` })
      return { message: `No frozen completions were found for the course ${kurkiId}`}
    }

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
        if (!sisIsValidGrade(completion.grade)) {
          logger.error({ message: `Invalid grade for student ${completion.studentNumber}: ${completion.grade}` })
          return matches
        }

        const language = selectLanguage(completion, course)

        if (completion && completion.studentNumber) {
          if (completion.grade === "-") {
            logger.info({ message: `Student ${completion.studentNumber} did not finish the course and has grade -`})
            return matches
          }
          if (!isImprovedGrade(earlierAttainments, completion.studentNumber, completion.grade, completion.courseFinishDate)) {
            logger.info({ message: `Student ${completion.studentNumber} already has a higher grade for the course`})
            return matches
          } else {
            return matches.concat({
              studentNumber: completion.studentNumber,
              batchId: batchId,
              grade: completion.grade,
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
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })
  
    let result = await automatedAddToDb(matches, course, batchId)

    if (result.message === "success" && inProduction) {
      result = await postTransferredId(kurkiId)
    }

    return result
  } catch (error) {
    logger.error({ message: `Error processing new completions: ${error.message}` })
    return { message: `Error processing new completions: ${error.message}`}
  }
}

module.exports = { 
  processKurkiEntries
}