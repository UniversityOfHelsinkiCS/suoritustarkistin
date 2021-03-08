const moment = require('moment')
const _ = require('lodash')
const db = require('../models/index')
const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const sendEmail = require('../utils/sendEmail')
const { EOAI_CODES } = require('@root/utils/validators')
const logger = require('@utils/logger')


const getOodiDate = (date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

const processEoaiCompletions = async (grader) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: EOAI_CODES
      },
      raw: true
    })
    const rawRegistrations = await getMultipleCourseRegistrations(EOAI_CODES)
    const rawCompletions = await getCompletions('elements-of-ai')

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
          courseId: EOAI_CODES[0],
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

    logger.info({message: `${EOAI_CODES[0]}xx: Found ${matches.length} new completions.`, courseCode: EOAI_CODES[0], amount: matches.length, oodi: true})

    const date = new Date()

    const courseStrings = {
      en_US: '##6#AYTKT21018#The Elements of AI#',
      fi_FI: '##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#',
      sv_SE:
        '##2#AYTKT21018sv#Elements of AI: Grunderna i artificiell intelligens#'
    }

    const data = matches
      .map((match) => {
        const completionDate = match.completionDate
          ? new Date(match.completionDate)
          : date
        return `${match.studentId}${
          courseStrings[match.completionLanguage]
        }${getOodiDate(completionDate)}#0#Hyv.#106##${
          grader.employeeId
        }#2#H930#11#93013#3##2,0`
      })

    if (matches.length) {
      const unique = _.uniq(data)
      const report = unique.join('\n')
      const dbReport = await db.reports.create({
        fileName: `${EOAI_CODES[0]}%${moment().format(
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
