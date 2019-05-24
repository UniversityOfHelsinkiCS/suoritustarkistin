const { getMultipleCourseRegistrations } = require('../services/eduweb')
const {
  getCompletions,
  getMultipleCourseCompletions
} = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('../utils/sendEmail')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const processNewCompletions = async (courses) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        [Op.or]: courses.map((c) => ({ courseId: c }))
      },
      raw: true
    })
    console.log(credits.length, 'completions found')

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
          } else {
            console.log('Unknown language code!')
          }
        }
      }
    }

    console.log(
      `${courses[0]}: Found ${matchesEn.length +
        matchesFi.length} new completions.`
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
    const pathEn = `reports/AYTKT21018%${shortDate}-V1-S2019.dat`
    const pathFi = `reports/AYTKT21018fi%${shortDate}-V1-S2019.dat`

    fs.writeFile(pathEn, reportEn, (err) => {
      if (err) throw err
    })

    fs.writeFile(pathFi, reportFi, (err) => {
      if (err) throw err
    })

    let attachments = []
    let dbReportEn = {}
    let dbReportFi = {}

    if (matchesEn.length > 0) {
      dbReportEn = await db.reports.create({
        fileName: `AYTKT21018%${shortDate}-V1-S2019.dat`,
        data: reportEn
      })
      attachments = attachments.concat({ path: pathEn })
    }
    if (matchesFi.length > 0) {
      dbReportFi = await db.reports.create({
        fileName: `AYTKT21018fi%${shortDate}-V1-S2019.dat`,
        data: reportFi
      })
      attachments = attachments.concat({ path: pathFi })
    }
    if (attachments.length > 0) {
      const info = await sendEmail(
        'New course completions.',
        'Transfer files as attachments.',
        attachments
      )
      if (info) {
        info.accepted.forEach((accepted) =>
          console.log(`Email sent to ${accepted}.`)
        )
        matchesEn.forEach((entry) => {
          db.credits.create({ ...entry, reportId: dbReportEn.id })
        })

        matchesFi.forEach((entry) => {
          db.credits.create({ ...entry, reportId: dbReportFi.id })
        })
      } else if (info) {
        info.rejected.forEach((rejected) =>
          console.log(`Address ${rejected} was rejected.`)
        )
      }
    }
  } catch (error) {
    console.log('Error:', error.message)
  }
}

module.exports = processNewCompletions
