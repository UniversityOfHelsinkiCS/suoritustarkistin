const getRegistrations = require('../services/eduweb')
const getCompletions = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('./sendEmail')

const processNewCompletions = async (course) => {
  try {
    const credits = await db.credits.findAll({ raw: true })
    const moocIdsInDb = credits.map((credit) => credit.moocId)
    const studentIdsInDb = credits.map((credit) => credit.studentId)

    const registrations = await getRegistrations(course)
    const completions = await getCompletions(course)

    const filteredRegistrations = registrations.filter(
      (registration) =>
        registration.onro && !studentIdsInDb.includes(registration.onro)
    )
    console.log('Filtered registrations:', filteredRegistrations.length)
    const filteredCompletions = completions.filter(
      (completion) => !moocIdsInDb.includes(completion.id)
    )
    console.log('Filtered completions:', filteredCompletions.length)

    let matchesFi = []
    let matchesEn = []
    for (const registration of filteredRegistrations) {
      for (const completion of filteredCompletions) {
        if (
          completion.email === registration.email ||
          completion.email === registration.mooc
        ) {
          const { id, completion_language, ...rest } = completion
          if (completion_language === 'fi_fi') {
            matchesFi = matchesFi.concat({
              ...rest,
              moocId: id,
              studentId: registration.onro,
              courseId: course,
              isInOodikone: false
            })
          } else if (completion_language === 'en_us') {
            matchesEn = matchesEn.concat({
              ...rest,
              moocId: id,
              studentId: registration.onro,
              courseId: course,
              isInOodikone: false
            })
          } else {
            console.log('unknown language')
          }
        }
      }
    }
    console.log(
      `Found ${matchesFi.length} matches for finnish course ${course}.`
    )

    console.log(
      `Found ${matchesEn.length} matches for english course ${course}.`
    )
    const dateNow = new Date()

    const date = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getFullYear()}`
    const shortDate = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getYear()}`

    const reportEn = matchesEn
      .map(
        (entry) =>
          `${
            entry.studentId
          }##6#AYTKT21018#The Elements of AI#${date}#0#Hyv.#106##${TEACHERCODE}#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    const reportFi = matchesFi
      .map(
        (entry) =>
          `${
            entry.studentId
          }##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#${date}#0#Hyv.#106##${TEACHERCODE}#1#H930#11#93013#3##2,0`
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
    if (matchesEn.length > 0) {
      attachments = attachments.concat({ path: pathEn })
    }
    if (matchesFi.length > 0) {
      attachments = attachments.concat({ path: pathFi })
    }
    if (attachments.length > 0) {
      sendEmail(attachments)
    }

    /* matchesEn.forEach((entry) => {
      db.credits.create(entry)
    })

    matchesFi.forEach((entry) => {
      db.credits.create(entry)
    }) */
  } catch (error) {
    console.log('Error:', error.message)
  }
}

module.exports = processNewCompletions
