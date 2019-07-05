const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getMultipleCourseCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const sendEmail = require('../utils/sendEmail')
const Sequelize = require('sequelize')
const logger = require('@utils/logger')

const Op = Sequelize.Op

const processNewCompletions = async (courses) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        [Op.or]: courses.map((c) => ({ courseId: c }))
      },
      raw: true
    })

    const completionIdsInDb = credits.map((credit) => credit.completionId)
    const moocIdsInDb = credits.map((credit) => credit.moocId)

    const studentIdsInDb = credits.map((credit) => credit.studentId)

    const registrations = await getMultipleCourseRegistrations(courses)
    const completions = await getMultipleCourseCompletions(courses)

    const filteredRegistrations = registrations.filter(
      (registration) =>
        registration.onro && !studentIdsInDb.includes(registration.onro)
    )
    const filteredCompletions = completions.filter(
      (completion) =>
        !moocIdsInDb.includes(completion.user_upstream_id) &&
        !completionIdsInDb.includes(completion.id)
    )

    let matchesFi = []
    let matchesEn = []
    let matchesSv = []

    for (const registration of filteredRegistrations) {
      for (const completion of filteredCompletions) {
        if (
          completion.email === registration.email ||
          completion.email === registration.mooc
        ) {
          const {
            id,
            completion_language,
            user_upstream_id,
            ...rest
          } = completion
          if (completion_language === 'fi_FI') {
            matchesFi = matchesFi.concat({
              ...rest,
              completionId: id,
              moocId: user_upstream_id,
              studentId: registration.onro,
              courseId: courses[0],
              isInOodikone: false
            })
          } else if (completion_language === 'en_US') {
            matchesEn = matchesEn.concat({
              ...rest,
              completionId: id,
              moocId: user_upstream_id,
              studentId: registration.onro,
              courseId: courses[0],
              isInOodikone: false
            })
          } else if (completion_language === 'sv_SE') {
            matchesSv = matchesSv.concat({
              ...rest,
              completionId: id,
              moocId: user_upstream_id,
              studentId: registration.onro,
              courseId: courses[0],
              isInOodikone: false
            })
          } else {
            logger.error(`Unknown language code: ${completion_language}`)
          }
        }
      }
    }

    logger.info(
      `${courses[0]}xx: Found ${matchesEn.length} English, ${
        matchesFi.length
      } Finnish, and ${matchesSv.length} Swedish completions.`
    )

    const dateNow = new Date()

    const date = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getFullYear()}`
    const shortDate = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getYear() - 100}`

    const reportEn = matchesEn
      .map(
        (entry) =>
          `${
            entry.studentId
          }##6#AYTKT21018#The Elements of AI#${date}#0#Hyv.#106##${
            process.env.TEACHERCODE
          }#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    const reportFi = matchesFi
      .map(
        (entry) =>
          `${
            entry.studentId
          }##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#${date}#0#Hyv.#106##${
            process.env.TEACHERCODE
          }#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    const reportSv = matchesSv
      .map(
        (entry) =>
          `${
            entry.studentId
          }##2#AYTKT21018sv#Elements of AI: Grunderna i artificiell intelligens#${date}#0#Hyv.#106##${
            process.env.TEACHERCODE
          }#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    let dbReportEn = null
    let dbReportFi = null
    let dbReportSv = null

    if (matchesEn.length > 0) {
      dbReportEn = await db.reports.create({
        fileName: `AYTKT21018%${shortDate}-V1-S2019.dat`,
        data: reportEn
      })
      matchesEn.forEach((entry) => {
        db.credits.create({ ...entry, reportId: dbReportEn.id })
      })
    }

    if (matchesFi.length > 0) {
      dbReportFi = await db.reports.create({
        fileName: `AYTKT21018fi%${shortDate}-V1-S2019.dat`,
        data: reportFi
      })
      matchesFi.forEach((entry) => {
        db.credits.create({ ...entry, reportId: dbReportFi.id })
      })
    }

    if (matchesSv.length > 0) {
      dbReportSv = await db.reports.create({
        fileName: `AYTKT21018sv%${shortDate}-V1-S2019.dat`,
        data: reportSv
      })
      matchesSv.forEach((entry) => {
        db.credits.create({ ...entry, reportId: dbReportSv.id })
      })
    }

    if (dbReportEn || dbReportFi || dbReportSv) {
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
  } catch (error) {
    logger.error('Error processing new completions:', error.message)
  }
}

module.exports = processNewCompletions
