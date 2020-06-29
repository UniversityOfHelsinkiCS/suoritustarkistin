const { getRegistrations } = require('../services/eduweb')
const { getCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const logger = require('@utils/logger')
const { isValidGrade } = require('../../utils/validators')

const slugs = {
  AY5823954: 'cyber-advanced-topics-2020',
  AY5823953: 'cyber-course-project-i'
}

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
  language
) => {
  try {
    /*     const rawRegistrations = await getRegistrations(courseCode)
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
      if (completion.grade && !isValidGrade(completion.grade)) {
        logger.error(`Invalid grade: ${completion.grade}`)
        return matches
      }

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
          grade: completion.grade || 'Hyv.'
        })
      } else {
        return matches
      }
    }, [])

     */

    const credits = await db.credits.findAll({
      where: {
        courseId: courseCode
      },
      raw: true
    })

    const registrations = await getRegistrations(courseCode)
    const completions = await getCompletions(slugs[courseCode] || courseCode)

    const matches = completions.reduce((matches, completion) => {
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
          grade: completion.grade || 'Hyv.',
          completionDate: completion.completion_date
        })
      } else {
        return matches
      }
    }, [])

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
        }#106##${teacherCode}#2#H930#11#93013#3##${creditAmount}`
      })
      .join('\n')

    if (matches.length) {
      const dbReport = await db.reports.create({
        fileName: `${courseCode}%${getOodiDate(date)}-V1-S2019.dat`,
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
