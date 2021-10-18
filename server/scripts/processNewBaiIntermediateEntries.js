const db = require('@models/index')
const logger = require('@utils/logger')
const { getRegistrations } = require('../services/eduweb')
const { getEarlierAttainmentsWithoutSubstituteCourses } = require('../services/importer')
const { getCompletions } = require('../services/pointsmooc')
const { earlierBaiCompletionFound } = require('../utils/earlierCompletions')
const { automatedAddToDb } = require('./automatedAddToDb')
const { OLD_BAI_CODE, OLD_BAI_INTERMEDIATE_CODE } = require('@root/utils/validators')
const { getBatchId, getMoocAttainmentDate } = require('@root/utils/common')
// const { getTestCompletions, getTestRegistrations } = require('../utils/testdataForMoocScripts')

const processNewBaiIntermediateEntries = async ({
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

    const oldIntermediateCourse = await db.courses.findOne({
      where: {
        courseCode: OLD_BAI_INTERMEDIATE_CODE
      }
    })

    const rawCredits = await db.credits.findAll({
      where: {
        courseId: [course.courseCode, OLD_BAI_INTERMEDIATE_CODE, OLD_BAI_CODE]
      },
      raw: true
    })

    const rawEntries = await db.raw_entries.findAll({ 
      where: {
        courseId: [course.id, oldBaiCourse.id, oldIntermediateCourse.id]
      }
    })

    const registrations = await getRegistrations(course.courseCode)
    const registeredIncluded = true
    const rawCompletions = await getCompletions(job.slug || course.courseCode, registeredIncluded)

    // If a completion with same or more credits if found, the new 
    // completion won't replace it
    const completions = rawCompletions.filter((completion) => {
      if (Number(completion.tier) <= 1) return false 

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

    const intermediateStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: course.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldBaiCourseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: oldBaiCourse.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    const oldIntermediateCourseStudentPairs = registrations.reduce((pairs, registration) => {
      if (registration && registration.onro) {
        return pairs.concat({ courseCode: oldIntermediateCourse.courseCode, studentNumber: registration.onro })
      } else {
        return pairs
      }
    }, [])

    // Fetch the earlier attainments for the new course code that is used after 1.9.2021
    const intermediateAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(intermediateStudentPairs)

    // Fetch the earlier attainments for the course code that was used before Sisu
    const oldBaiAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(oldBaiCourseStudentPairs)

    // Fetch the earlier attainments for the course code that was used temporarily in summer 2021
    const oldIntermediateAttainments = await getEarlierAttainmentsWithoutSubstituteCourses(oldIntermediateCourseStudentPairs)
    
    // Combine these to be all the earlier attainments for the same course
    const earlierAttainments = intermediateAttainments.concat(oldBaiAttainments).concat(oldIntermediateAttainments)

    const batchId = getBatchId(course.courseCode)
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

          const attainmentDate = getMoocAttainmentDate(
            completion.completion_registration_attempt_date,
            completion.completion_date,
            date
          )

          if (await earlierBaiCompletionFound(earlierAttainments, registration.onro, attainmentDate)) {
            logger.info({ message: `Earlier attainment found for student ${registration.onro}`})
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
              attainmentDate: attainmentDate,
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
  processNewBaiIntermediateEntries
}