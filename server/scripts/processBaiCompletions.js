const moment = require('moment')

const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')

const languageCodes = {
  en: '6',
  fi: '1',
  sv: '2'
}

const isTierUpgrade = (previousTiers, completion) => {
  if (!completion.tier || completion.tier === 1) return false
  if (previousTiers.includes(completion.tier)) return false
  return true
}

const getOodiDate = (date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

const processMoocCompletions = async (
  courseCode,
  courseName,
  tierCreditAmount,
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
    const completions = await getCompletions(slug)

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise
        const previousTiers = credits
          .filter(
            (credit) =>
              credit.completionId === completion.id ||
              credit.moocId === completion.user_upstream_id
          )
          .map((credit) => credit.tier)

        if (!isTierUpgrade(previousTiers, completion)) return matches

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
            isInOodikone: false,
            completionLanguage: completion.completion_language,
            grade: completion.grade || 'Hyv.',
            completionDate: completion.completion_date,
            tier: completion.tier
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
        }#${courseCode}#${courseName}#${getOodiDate(completionDate)}#0#${
          match.grade
        }#106##${teacherCode}#2#H930#11#93013#3##${
          tierCreditAmount[match.tier]
        }`
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
