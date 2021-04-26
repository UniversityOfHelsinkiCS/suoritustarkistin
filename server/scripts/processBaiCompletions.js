const moment = require('moment')

const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')
const _ = require('lodash')
const { BAI_CODES } = require('../../utils/validators')

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

const tierCreditAmount = { 1: '0,0', 2: '1,0', 3: '2,0' } // Tier credit amounts

const getOodiDate = (date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

const processBaiCompletions = async (grader, course, job) => {
  try {

    const courseCode = BAI_CODES[0]
    const courseName = course.name
    const teacherCode = grader.employeeId
    const language = course.language

    const credits = await db.credits.findAll({
      where: {
        courseId: courseCode
      },
      raw: true
    })

    const registrations = await getRegistrations(courseCode)
    const completions = await getCompletions(job.slug)

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

    logger.info({message: `${courseCode}: Found ${matches.length} new completions.`, courseCode, amount: matches.length, oodi: true})

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
        }#106##${teacherCode}#2#H930#11#93013#3##${
          tierCreditAmount[match.tier]
        }`
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
      if (dbReport)
        sendEmail({
          subject: `Uusia kurssisuorituksia: ${courseName}`,
          text: 'Viikoittaisen automaattiajon tuottamat siirtotiedostot saatavilla OodiToolissa.'
        })
    }
  } catch (error) {
    logger.error('Error processing new completions:', error)
  }
}

module.exports = processBaiCompletions
