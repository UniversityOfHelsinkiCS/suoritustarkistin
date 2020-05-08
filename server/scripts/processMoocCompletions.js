const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')

const slugs = {
  AY5823954: 'cyber-advanced-topics-2020',
  AY5823953: 'cyber-course-project-i'
}

const processMoocCompletions = async (
  courseCode,
  courseName,
  creditAmount,
  teacherCode
) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: courseCode
      },
      raw: true
    })
    const rawRegistrations = await getRegistrations(courseCode)
    const rawCompletions = await getCompletions(slugs[courseCode] || courseCode)

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
      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() === completion.email.toLowerCase() ||
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
          grade: completion.grade
        })
      } else {
        return matches
      }
    }, [])

    logger.info(`${courseCode}: Found ${matches.length} new completions.`)

    const date = new Date()
    const dateString = `${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear()}`

    const report = matches
      .map((match) => {
        return `${
          match.studentId
        }##6#${courseCode}#${courseName}#${dateString}#0#${
          match.grade || 'Hyv.'
        }#106##${teacherCode}#2#H930#11#93013#3##${creditAmount}`
      })
      .join('\n')

    if (matches.length) {
      const dbReport = await db.reports.create({
        fileName: `${courseCode}%${dateString}-V1-S2019.dat`,
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
