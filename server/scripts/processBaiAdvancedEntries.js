const moment = require('moment')
const db = require('@models/index')
const logger = require('@utils/logger')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { automatedAddToDb } = require('./automatedAddToDb')
const { advancedFound } = require('../utils/earlierCompletions')
const { OLD_BAI_CODE, BAI_INTERMEDIATE_CODE, BAI_ADVANCED_CODE } = require('@root/utils/validators')
// const { getTestRegistrations, getTestCompletions } = require('../utils/testdataForMoocScripts')

const processBaiAdvancedEntries = async ({
  job,
  course,
  grader
}) => {
  try {
    const intermediateCourse = await db.courses.findOne({
      where: {
        courseCode: BAI_INTERMEDIATE_CODE
      }
    })

    const rawCredits = await db.credits.findAll({
      where: {
        courseId: OLD_BAI_CODE
      },
      raw: true
    })

    const advancedRawEntries = await db.raw_entries.findAll({ 
      where: {
        courseId: course.id
      }
    })
    
    const intermediateRawEntries = await db.raw_entries.findAll({
      where: {
        courseId: intermediateCourse.id
      }
    })

    const registeredIncluded = true

    const registrations = await getRegistrations(course.courseCode)
    const rawCompletions = await getCompletions(job.slug || course.courseCode, registeredIncluded)

    const completions = rawCompletions.filter((completion) => {
      if (!completion.tier === Number(3)) return false

      const previousCredits = rawCredits.filter(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      )

      const previousIntermediateCredit = previousCredits.filter((credit) => credit.tier === 2)
      const previousAdvancedCredit = previousCredits.filter((credit) => credit.tier === 3)

      const previousAdvancedEntries = advancedRawEntries.filter(
        (entry) =>
          entry.moocCompletionId === completion.id ||
          entry.moocUserId === completion.user_upstream_id
      )

      const previousIntermediateEntries = intermediateRawEntries.filter(
        (entry) =>
          entry.moocCompletionId === completion.id ||
          entry.moocUserId === completion.user_upstream_id
      )

      return (
        (previousIntermediateEntries.length !== 0 || previousIntermediateCredit.length !== 0)
        && previousAdvancedEntries.length === 0
        && previousAdvancedCredit.length === 0
      )
    })

    const oldBaiPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat(
          { courseCode: OLD_BAI_CODE, studentNumber: registration.onro },
        )
      } else {
        return pairs
      }
    }, [])

    const advancedPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: BAI_ADVANCED_CODE, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldBaiAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(oldBaiPairs)
    const advancedAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(advancedPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    let matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() === completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )
        if (registration && registration.onro) {
          if (await advancedFound(advancedAttainments, oldBaiAttainments, registration.onro, completion.completion_date)) {
            return matches
          } else if (matches.some((c) => c.studentNumber === registration.onro)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: "Hyv.",
              credits: 1,
              language: 'en',
              attainmentDate: completion.completion_date || date,
              graderId: grader.id,
              reporterId: null,
              courseId: course.id,
              moocUserId: completion.user_upstream_id,
              moocCompletionId: completion.id
            })
          }
        } else {
          return matches
        }
      },
      []
    )

    if (!matches) matches = []
    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    const result = await automatedAddToDb(matches, course, batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processBaiAdvancedEntries
}