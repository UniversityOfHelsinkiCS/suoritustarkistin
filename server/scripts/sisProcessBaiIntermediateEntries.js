const moment = require('moment')
const db = require('@models/index')
const logger = require('@utils/logger')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { earlierBaiCompletionFound } = require('../utils/sisEarlierCompletions')
const { automatedAddToDb } = require('./automatedAddToDb')
const { OLD_BAI_CODE } = require('@root/utils/validators')

const processBaiIntermediateEntries = async ({
  job,
  course,
  grader
}) => {
  try {
    const oldBaiCourse = await db.courses.findOne({
      where: {
        courseCode: OLD_BAI_CODE
      }
    })

    const rawCredits = await db.credits.findAll({
      where: {
        courseId: [course.courseCode, OLD_BAI_CODE]
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({ 
      where: {
        courseId: [course.id, oldBaiCourse.id]
      }
    })

    const registrations = await getRegistrations(course.courseCode)
    const rawCompletions = await getCompletions(job.slug || course.courseCode) // Change this, depending on the mooc-slug / course code

    // If a completion with same or more credits if found, the new 
    // completion won't replace it
    const completions = rawCompletions.filter((completion) => {
      const previousCredits = rawCredits.filter(
        (credit) =>
          credit.completionId === completion.id ||
          credit.moocId === completion.user_upstream_id
      )
      const previousEntries = rawEntries.filter(
        (entry) =>
          entry.moocCompletionId === completion.id ||
          entry.moocUserId === completion.user_upstream_id
      )

      return (previousCredits.length === 0 && previousEntries.length === 0)
    })

    const courseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldCourseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: oldBaiCourse.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const allCourseStudentPairs = courseStudentPairs.concat(oldCourseStudentPairs)
    const earlierAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(allCourseStudentPairs)

    const batchId = `${course.courseCode}-${moment().format(
      'DD.MM.YY-HHmmss'
    )}`
    const date = new Date()

    const matches = await completions.reduce(
      async (matchesPromise, completion) => {
        const matches = await matchesPromise

        const registration = registrations.find(
          (registration) =>
            registration.email.toLowerCase() === completion.email.toLowerCase() ||
            registration.mooc.toLowerCase() === completion.email.toLowerCase()
        )
        if (registration && registration.onro) {
          if (await earlierBaiCompletionFound(earlierAttainments, registration.onro)) {
            return matches
          } else {
            return matches.concat({
              studentNumber: registration.onro,
              batchId: batchId,
              grade: "Hyv.",
              credits: completion.credits, // Or possibly 1, depending on how the mooc-endpoint is created
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

    logger.info({ message: `${course.courseCode}: Found ${matches.length} new completions.` })

    const result = await automatedAddToDb(matches, course, batchId)
    return result
  } catch (error) {
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: error.message }
  }
}

module.exports = {
  processBaiIntermediateEntries
}