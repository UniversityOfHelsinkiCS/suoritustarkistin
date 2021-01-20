const moment = require('moment')
const { getMultipleCourseRegistrations } = require('../services/eduweb')
const { getEoAICompletions } = require('../services/pointsmooc')
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')

const languageMap = {
  "fi_FI" : "fi",
  "en_US" : "en",
  "sv_SE" : "sv"
} 

const sisProcessEoaiEntries = async ({graderId}, transaction) => {
  const courseCodes = [
    { code: 'AYTKT21018', languageCode: "fi_FI" }, 
    { code: 'AYTKT21018fi', languageCode: "en_US" },
    { code: 'AYTKT21018sv', languageCode: "sv_SE" }
  ]

  try {
    const courseCode = courseCodes.map((c) => c.code) 
    const courses = await db.courses.findAll({ 
      where: {
        courseCode: courseCode
      },
      raw: true
    })

    const credits = await db.credits.findAll({
      where: {
        courseId: courseCode
      },
      raw: true
    })

    const grader = await db.users.findOne({
      where: {
        employeeId: graderId
      }
    })
    const rawRegistrations = await getMultipleCourseRegistrations(courseCode)
    const rawCompletions = await getEoAICompletions()
    const rawEntries = await db.raw_entries.findAll({ where: { courseId: courses.map((c) => c.id) }})

    const registrations = rawRegistrations.filter((registration) => {
      const earlierCredit = credits.find(
        (credit) =>
          credit.studentId === registration.onro
      )
      const earlierEntry = rawEntries.find(
        (entry) =>
          entry.studentNumber === registration.onro 
      )
      return (!earlierCredit && !earlierEntry)
    })

    const completions = rawCompletions.filter((completion) => {
      const earlierCredit = credits.find(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      )
      const earlierEntry = rawEntries.find(
        (entry) =>
          entry.moocCompletionId === completionId ||
          entry.moocUserId === completion.user_upstream_id
      )
      return (!earlierCredit && !earlierEntry)
    })

    const batchId = `${courses[0].courseCode}%${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = completions.reduce((matches, completion) => {
      if (!['fi_FI', 'en_US', 'sv_SE'].includes(completion.completion_language))
        return matches

      const language = languageMap[completion.completion_language]
      const courseVersion = courses.find((c) => c.language === language)

      const registration = registrations.find(
        (registration) =>
          registration.email.toLowerCase() === completion.email.toLowerCase() ||
          registration.mooc.toLowerCase() === completion.email.toLowerCase()
      )
      // Once the gradeScale has been fixed, remember to change the grade to "Hyv."
      if (registration && registration.onro) {
        return matches.concat({
          studentNumber: registration.onro,
          batchId: batchId,
          grade: 5,
          credits: courses[0].credits,
          language: language,
          attainmentDate: completion.completion_date || date,
          graderId: grader.id,
          reporterId: null,
          courseId: courseVersion.id,
          completionId: completion.id,
          isOpenUni: false,
          moocUserId: completion.user_upstream_id,
          moocCompletionId: completion.id
        })
      } else {
        return matches
      }
    }, [])

    logger.info(`${courseCodes[0].code}: Found ${matches.length} new completions.`)

    const newRawEntries = await db.raw_entries.bulkCreate(matches, {returning: true, transaction})
    await processEntries(newRawEntries, transaction)
    return true

  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
  }
}

module.exports = { 
  sisProcessEoaiEntries
}
