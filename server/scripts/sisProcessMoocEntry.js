const moment = require('moment')
const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
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

const sisProcessMoocCompletions = async (
  courseCode,
  courseName,
  creditAmount,
  teacherCode,
  language,
  slug
) => {
  try {
    // TODO: FInd a better way to check if there are already completions 
    // for the same course by the same student
    const rawEntries = await db.raw_entries.findAll({
      where: {
        courseCode: courseCode
      }
    })

    const registrations = await getRegistrations(courseCode)
    const completions = await getCompletions(slug || courseCode)

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        const previousGrades = raw_entries
          .filter(
            (entry) =>
              entry.completionId === completion.id ||
              entry.moocId === completion.user_upstream_id
          )
          .map((credit) => credit.grade)

        if (completion.grade) {
          if (!isValidGrade(completion.grade)) {
            logger.error(`Invalid grade: ${completion.grade}`)
            return matches
          }

          if (
            previousGrades.length > 0 &&
            !isKorotus(previousGrades, completion.grade)
          ) {
            return matches
          }
        }

        if (!completion.grade && previousGrades.length > 0) {
          return matches
        }

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() ===
              completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )

        if (registration && registration.onro) {
          return matches.concat({
            studentId: registration.onro,
            courseId: courseCode,
            moocId: completion.user_upstream_id,
            completionId: completion.id,
            completionLanguage: completion.completion_language,
            grade: completion.grade || 'Hyv.',
            completionDate: completion.completion_date
          })
        } else {
          return matches
        }
      },
      []
    )

    logger.info(`${courseCode}: Found ${matches.length} new completions.`)

    const date = new Date()

    const report = matches
      .map((match) => {
        const completionDate = match.completionDate
          ? new Date(match.completionDate)
          : date
        return `${match.studentId}##${
          languageCodes[language] || '6'
        }#${courseCode}#${courseName}#${(completionDate.getDate())}#0#${
          match.grade
        }#106##${teacherCode}#2#H930#11#93013#3##${creditAmount}`
      })
      .join('\n')

    if (matches.length) {
      const dbReport = await db.reports.create({
        fileName: `${courseCode}%${moment().format(
          'DD.MM.YY-HHmmss'
        )}_AUTOMATIC.dat`,
        data: report
      })

      matches.forEach((match) => {
        match.reportId = dbReport.id
        db.credits.create(match)
      })
      if (dbReport) {
        console.log("Success!")
      }
    }
  } catch (error) {
    logger.error('Error processing new completions:', error)
  }
}

module.exports = sisProcessMoocCompletions
