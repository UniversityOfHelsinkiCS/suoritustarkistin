const moment = require('moment')

const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getEoAICompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')

const getOodiDate = (date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

const processEoaiCompletions = async (courses) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: courses
      },
      raw: true
    })
    const rawRegistrations = await getMultipleCourseRegistrations(courses)
    const rawCompletions = await getEoAICompletions()

    const registrations = rawRegistrations.filter((registration) => {
      return !credits.find((credit) => credit.studentId === registration.onro)
    })

    const completions = rawCompletions.filter((completion) => {
      return !credits.find(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      )
    })

    const matches = completions.reduce((matches, completion) => {
      if (!['fi_FI', 'en_US', 'sv_SE'].includes(completion.completion_language))
        return matches

      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() === completion.email.toLowerCase() ||
          registration.mooc.toLowerCase() === completion.email.toLowerCase()
      )

      if (registration && registration.onro) {
        return matches.concat({
          studentId: registration.onro,
          courseId: courses[0],
          moocId: completion.user_upstream_id,
          completionId: completion.id,
          isInOodikone: false,
          completionLanguage: completion.completion_language,
          completionDate: completion.completion_date
        })
      } else {
        return matches
      }
    }, [])

    logger.info(`${courses[0]}xx: Found ${matches.length} new completions.`)

    const date = new Date()

    const courseStrings = {
      en_US: '##6#AYTKT21018#The Elements of AI#',
      fi_FI: '##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#',
      sv_SE:
        '##2#AYTKT21018sv#Elements of AI: Grunderna i artificiell intelligens#'
    }

    const report = matches
      .map((match) => {
        const completionDate = match.completionDate
          ? new Date(match.completionDate)
          : date
        return `${match.studentId}${
          courseStrings[match.completionLanguage]
        }${getOodiDate(completionDate)}#0#Hyv.#106##${
          process.env.TEACHERCODE
        }#2#H930#11#93013#3##2,0`
      })
      .join('\n')

    if (matches.length) {
      const dbReport = await db.reports.create({
        fileName: `${courses[0]}%${moment().format(
          'DD.MM.YY-HHmmss'
        )}-AUTOMATIC.dat`,
        data: report
      })

      matches.forEach((match) => {
        match.reportId = dbReport.id
        db.credits.create(match)
      })
      if (dbReport) {
        const info = await sendEmail(
          'Uusia kurssisuorituksia: Elements of AI',
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
    logger.error(`Error processing new completions: ${error.message}`)
  }
}

module.exports = processEoaiCompletions
