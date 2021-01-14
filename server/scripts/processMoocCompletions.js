const moment = require('moment')

const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')
const { isValidGrade } = require('../../utils/validators')
const hasOodiEntry = require('../services/oodikone')
const _ = require('lodash')

const languageCodes = {
  en: '6',
  fi: '1',
  sv: '2'
}

const isKorotus = (previousGrades, grade) => {
  if (!isValidGrade(grade)) return false
  const validGrades = ['Hyl.', 'Hyv.', '1', '2', '3', '4', '5']
  const betterOrSame = previousGrades.filter(
    (previousGrade) =>
      (validGrades.indexOf(previousGrade) || 0) >=
      (validGrades.indexOf(grade) || 0)
  )

  return betterOrSame.length === 0
}

const getOodiDate = (date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

const processMoocCompletions = async (
  courseCode,
  courseName,
  creditAmount,
  teacherCode,
  language,
  slug
) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: courseCode
      },
      raw: true
    })

    const registrations = await getRegistrations(courseCode)
    const completions = await getCompletions(slug || courseCode)

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        const previousGrades = credits
          .filter(
            (credit) =>
              credit.completionId === completion.id ||
              credit.moocId === completion.user_upstream_id
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

        if (registration && registration.onro && slug === 'python-kesa-20') {
          const hasJavaOhPe = await hasOodiEntry(registration.onro, 'TKT10002')
          const hasOpenJavaOhPe = await hasOodiEntry(
            registration.onro,
            'AYTKT10002'
          )

          if (hasJavaOhPe || hasOpenJavaOhPe) {
            // Implement beta testing credits here
            // CURRETLY THIS BLOCKS GRADE IMPROVING FOR THIS COURSE!
            return matches
          }
        }

        if (registration && registration.onro) {
          return matches.concat({
            studentId: registration.onro,
            courseId: courseCode,
            moocId: completion.user_upstream_id,
            completionId: completion.id,
            isInOodikone: false,
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

    logger.info({message: `${courseCode}: Found ${matches.length} new completions.`, amount: matches.length, oodi: true, courseCode})

    const date = new Date()

    const data = matches
      .map((match) => {
        const completionDate = match.completionDate
          ? new Date(match.completionDate)
          : date
        return `${match.studentId}##${
          languageCodes[language] || '6'
        }#${courseCode}#${courseName}#${getOodiDate(completionDate)}#0#${
          match.grade
        }#106##${teacherCode}#2#H930#11#93013#3##${creditAmount}`
      })

    if (matches.length) {
      const unique = _.uniq(data)
      const report = unique.join('\n')
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
        const info = await sendEmail(
          `Uusia kurssisuorituksia: ${courseName}`,
          'Viikoittaisen automaattiajon tuottamat siirtotiedostot saatavilla OodiToolissa.'
        )
        if (info) {
          info.accepted.forEach((accepted) =>
            logger.info(`Email sent to ${accepted}.`)
          )
        } else if (info) {
          info.rejected.forEach((rejected) =>
            logger.error(`Address ${rejected} was rejected.`)
          )
        }
      }
    }
  } catch (error) {
    logger.error('Error processing new completions:', error)
  }
}

module.exports = processMoocCompletions
