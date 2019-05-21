const getRegistrations = require('../services/eduweb')
const getCompletions = require('../services/pointsmooc')
const hasOodiEntry = require('../services/oodikone')
const db = require('../models/index')

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

const fixMoocIds = async (course) => {
  try {
    const credits = await db.credits.findAll({
      raw: true
    })

    const completions = await getCompletions(course)
    const registrations = await getRegistrations(course)

    const fixedCompletions = completions.reduce((acc, curr) => {
      if (isValidStudentId(curr.student_number)) {
        return acc.concat(curr)
      } else if (fixStudentId(curr.student_number)) {
        return acc.concat({
          ...curr,
          student_number: fixStudentId(curr.student_number)
        })
      } else {
        return acc
      }
    }, [])

    console.log('fixedcompletions:', fixedCompletions.length)
    let updatecount = 0
    for (const credit of credits) {
      const registration = registrations.find(
        (reg) => credit.studentId === reg.onro
      )
      if (registration) {
        const completion = completions.find(
          (comp) =>
            comp.email === registration.email ||
            comp.email === registration.mooc
        )
        if (completion) {
          const isInOodikone = await hasOodiEntry(registration.onro, course)
          const res = await db.credits.update(
            {
              moocId: completion.user_upstream_id,
              completionId: completion.id,
              isInOodikone: isInOodikone
            },
            { where: { id: credit.id } }
          )
          if (res) updatecount++
        }
      } else {
        const completion = fixedCompletions.find(
          (comp) => comp.student_number === credit.studentId
        )
        if (completion) {
          const isInOodikone = await hasOodiEntry(
            completion.student_number,
            course
          )
          const res = await db.credits.update(
            {
              moocId: completion.user_upstream_id,
              completionId: completion.id,
              isInOodikone: isInOodikone
            },
            { where: { id: credit.id } }
          )
          if (res) updatecount++
        }
      }
    }

    console.log(
      `Updated ${updatecount} credit entries with new completionIds and isInOodikone`
    )
  } catch (error) {
    console.log('Error:', error.message)
  }
}

module.exports = fixMoocIds
