const moment = require('moment')
const { getCompletions } = require('../services/kurki')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')
const { isValidGrade, SIS_LANGUAGES } = require('../../utils/validators')
const { isImprovedGrade } = require('../utils/sisEarlierCompletions')
const { getEarlierAttainments } = require('../services/importer')

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
}, transaction) => {

  try {
    const completions = await getCompletions(kurkiId)
    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`

    const courseStudentPairs = completions.reduce((pairs, completion) => {
      if (completion && completion.studentNumber) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: completion.studentNumber })
      } else {
        return pairs
      }
    }, [])

    const earlierAttainments = await getEarlierAttainments(courseStudentPairs)

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

        // Remember to change the grade, once the gradeScale-issue has been solved
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
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.`, sis: true })
  
    if (matches && matches.length > 0) {
      const newRawEntries = await db.raw_entries.bulkCreate(matches, { returning: true })
      logger.info({ message: `${matches.length} new raw entries created`, amount: newRawEntries.length, course: course.courseCode, batchId, sis: true })

      const checkImprovements = false
      const [failed, success] = await processEntries(newRawEntries, checkImprovements)

      if (failed.length) {
        logger.info({ message: `${failed.length} entries failed`, sis:true })

        for (const failedEntry of failed) {
          logger.info({ message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}`})
          await db.raw_entries.destroy({
            where: {
              id: failedEntry.id
            }
          })
        }
      }

      if (success && success.length) {
        await db.entries.bulkCreate(success, { transaction })
        logger.info({ message: `${success.length} new entries created`, amount: success.length, sis: true })
        return { message: "success" }
      }
    }

    return { message: "no new entries" }
  } catch (error) {
    logger.error(`Error processing new completions: ${error}`)
    return { error }
  }
}

module.exports = { 
  processKurkiEntries
}