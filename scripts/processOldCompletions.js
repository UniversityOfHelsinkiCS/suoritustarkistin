const getRegistrations = require('../services/eduweb')
const getCompletions = require('../services/pointsmooc')
const db = require('../models/index')
const fs = require('fs')
const sendEmail = require('../utils/sendEmail')

const isValidStudentId = (id) => {
  if (/^0\d{8}$/.test(id)) {
    // is a 9 digit number
    const multipliers = [7, 1, 3, 7, 1, 3, 7]
    const checksum = id
      .substring(1, 8)
      .split('')
      .reduce((sum, curr, index) => {
        return (sum + curr * multipliers[index]) % 10
      }, 0)
    return (10 - checksum) % 10 == id[8]
  }
  return false
}

const fixStudentId = (id) => {
  if (id.length === 8 && id[0] === '1' && isValidStudentId('0' + id)) {
    return '0' + id
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

    const completions = await getCompletions(course)
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
      (c) => {
        return isValidStudentId(c.student_number)
      }
    )

    const unmarkedCompletionsWithInvalidStudentNumber = unmarkedCompletionsWithStudentNumber.filter(
      (c) => {
        return !isValidStudentId(c.student_number)
      }
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

    const completionsToBeMarked = completionsAlmostToBeMarked.filter((c) => {
      return (
        !studentIdsInDb.includes(c.student_number) &&
        !registeredStudentIds.includes(c.student_number)
      )
    })

    console.log(
      `${course}: Found ${
        completionsToBeMarked.length
      } unmarked old completions.`
    )

    const completionsEn = completionsToBeMarked.filter(
      (c) => c.completion_language === 'en_US'
    )
    const completionsFi = completionsToBeMarked.filter(
      (c) => c.completion_language === 'fi_FI'
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
    const pathEn = `reports/AYTKT21018%${shortDate}-V1-S2019.dat`
    const pathFi = `reports/AYTKT21018fi%${shortDate}-V1-S2019.dat`

    fs.writeFile(pathEn, reportEn, (err) => {
      if (err) throw err
    })

    fs.writeFile(pathFi, reportFi, (err) => {
      if (err) throw err
    })

    let attachments = []
    if (completionsEn.length > 0) {
      attachments = attachments.concat({ path: pathEn })
    }
    if (completionsFi.length > 0) {
      attachments = attachments.concat({ path: pathFi })
    }
    if (attachments.length > 0) {
      const info = await sendEmail(
        'New course completions.',
        'Old style HY course completions for Elements of AI. Transfer files as attachments.',
        attachments
      )
      if (info) {
        info.accepted.forEach((accepted) =>
          console.log(`Email sent to ${accepted}.`)
        )

        completionsEn.forEach((entry) => {
          const { id, student_number, user_upstream_id } = entry
          const newEntry = {
            studentId: student_number,
            courseId: course,
            completionId: id,
            moocId: user_upstream_id,
            isInOodikone: false
          }

          db.credits.create(newEntry)
        })

        completionsFi.forEach((entry) => {
          const { id, student_number, user_upstream_id } = entry
          const newEntry = {
            studentId: student_number,
            courseId: course,
            completionId: id,
            moocId: user_upstream_id,
            isInOodikone: false
          }

          db.credits.create(newEntry)
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

module.exports = processOldCompletions
