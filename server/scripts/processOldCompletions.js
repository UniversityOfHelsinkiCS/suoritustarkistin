const {
  getRegistrations,
  getMultipleCourseRegistrations
} = require('../services/eduweb')
const { getMultipleCourseCompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('../utils/sendEmail')
const { isValidStudentId } = require('../../utils/validators')

const fixStudentId = (id) => {
  if (id.length === 8 && id[0] === '1' && isValidStudentId(`0${id}`)) {
    return `0${id}`
  }
  for (let i = 0; i < id.length - 8; i++) {
    const candidate = id.substring(i, i + 9)
    if (candidate[0] === '0' && isValidStudentId(candidate)) {
      return candidate
    }
  }

  return null
}

const processOldCompletions = async (course) => {
  try {
    const credits = await db.credits.findAll({
      where: {
        courseId: course
      },
      raw: true
    })
    const moocIdsInDb = credits.map((credit) => credit.moocId)
    const completionIdsInDb = credits.map((credit) => credit.completionId)
    const studentIdsInDb = credits.map((credit) => credit.studentId)

    const completions = await getMultipleCourseCompletions([course])
    const registrations = await getRegistrations(course)

    const registeredStudentIds = registrations
      .filter((reg) => reg.onro !== '')
      .map((reg) => reg.onro)

    const unmarkedCompletionsWithStudentNumber = completions.filter(
      (completion) =>
        completion.student_number !== '' &&
        !completionIdsInDb.includes(completion.id) &&
        !moocIdsInDb.includes(completion.user_upstream_id)
    )

    const unmarkedCompletionsWithValidStudentNumber = unmarkedCompletionsWithStudentNumber.filter(
      (c) => isValidStudentId(c.student_number)
    )

    const unmarkedCompletionsWithInvalidStudentNumber = unmarkedCompletionsWithStudentNumber.filter(
      (c) => !isValidStudentId(c.student_number)
    )
    const completionsAlmostToBeMarked = unmarkedCompletionsWithInvalidStudentNumber.reduce(
      (acc, curr) => {
        const fixedStudentNumber = fixStudentId(curr.student_number)
        if (fixedStudentNumber) {
          return acc.concat({ ...curr, student_number: fixedStudentNumber })
        }
        return acc
      },
      unmarkedCompletionsWithValidStudentNumber
    )

    const completionsToBeMarked = completionsAlmostToBeMarked.filter(
      (c) =>
        !studentIdsInDb.includes(c.student_number) &&
        !registeredStudentIds.includes(c.student_number)
    )

    const completionsEn = completionsToBeMarked.filter(
      (c) => c.completion_language === 'en_US'
    )
    const completionsFi = completionsToBeMarked.filter(
      (c) => c.completion_language === 'fi_FI'
    )

    console.log(
      `${course}: Found ${completionsEn.length +
        completionsFi.length} unmarked old completions.`
    )

    const dateNow = new Date()

    const date = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getFullYear()}`
    const shortDate = `${dateNow.getDate()}.${dateNow.getMonth() +
      1}.${dateNow.getYear() - 100}`

    const reportEn = completionsEn
      .map(
        (entry) =>
          `${
            entry.student_number
          }##6#AYTKT21018#The Elements of AI#${date}#0#Hyv.#106##${
            process.env.TEACHERCODE
          }#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    const reportFi = completionsFi
      .map(
        (entry) =>
          `${
            entry.student_number
          }##1#AYTKT21018fi#Elements of AI: Tekoälyn perusteet#${date}#0#Hyv.#106##${
            process.env.TEACHERCODE
          }#1#H930#11#93013#3##2,0`
      )
      .join('\n')

    let dbReportEn = null
    let dbReportFi = null

    if (completionsEn.length > 0) {
      dbReportEn = await db.reports.create({
        fileName: `AYTKT21018%${shortDate}-V2-S2019.dat`,
        data: reportEn
      })
      completionsEn.forEach((entry) => {
        const { id, student_number, user_upstream_id } = entry
        const newEntry = {
          studentId: student_number,
          courseId: course,
          completionId: id,
          moocId: user_upstream_id,
          isInOodikone: false,
          reportId: dbReportEn.id
        }

        db.credits.create(newEntry)
      })
    }

    if (completionsFi.length > 0) {
      dbReportFi = await db.reports.create({
        fileName: `AYTKT21018fi%${shortDate}-V2-S2019.dat`,
        data: reportFi
      })
      completionsFi.forEach((entry) => {
        const { id, student_number, user_upstream_id } = entry
        const newEntry = {
          studentId: student_number,
          courseId: course,
          completionId: id,
          moocId: user_upstream_id,
          isInOodikone: false,
          reportId: dbReportFi.id
        }

        db.credits.create(newEntry)
      })
    }
    if (dbReportEn || dbReportFi) {
      const info = await sendEmail(
        'Uusia kurssisuorituksia: Elements of AI',
        'Vanhalla tavalla ilmoittautuneiden siirtotiedosto saatavilla OodiToolissa.'
      )
      if (info) {
        info.accepted.forEach((accepted) =>
          console.log(`Email sent to ${accepted}.`)
        )
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

module.exports = processOldCompletions
