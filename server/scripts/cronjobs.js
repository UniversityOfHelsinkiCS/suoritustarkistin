const cron = require('node-cron')
const db = require('../models/index')
const logger = require('@utils/logger')
const { EOAI_CODES, BAI_INTERMEDIATE_CODE, BAI_ADVANCED_CODE } = require('@root/utils/validators')
const { processEoaiEntries } = require('./processEoaiEntries')
const { processBaiIntermediateEntries } = require('./processBaiIntermediateEntries')
const { processBaiAdvancedEntries } = require('./processBaiAdvancedEntries')
const { processMoocEntries } = require('./processMoocEntries')

const refreshEntriesCron = require('./refreshEntryCron')
const deleteOldEntries = require('./deleteOldEntriesCron')

let cronjobs = {}

const initializeCronJobs = async () => {
  logger.info({ message: "Initialized cronjobs" })

  const jobs = await db.jobs.findAll({
    where: { active: true }
  })
  const courses = await db.courses.findAll({})
  const users = await db.users.findAll({})

  cronjobs = jobs.reduce((acc, job) => {
    const course = courses.find((c) => c.id === job.courseId)
    const grader = users.find((u) => u.id === job.graderId)

    const createdJob = cron.schedule(job.schedule, async () => {
      const timestamp = new Date(Date.now())
      logger.info(
        `${timestamp.toLocaleString()} Processing new ${course.name} (${
          course.courseCode
        }) completions.`
      )

      let result = ""

      if (EOAI_CODES.includes(course.courseCode)) {
        result = await processEoaiEntries({ grader })
      } else if (BAI_INTERMEDIATE_CODE === course.courseCode) {
        result = await processBaiIntermediateEntries({ job, course, grader })
      } else if (BAI_ADVANCED_CODE === course.courseCode) {
        result = await processBaiAdvancedEntries({ job, course, grader })
      } else {
        result = await processMoocEntries({ job, course, grader })
      }
      if (result.message === "no new entries" || result.message === "success") {
        logger.info({ message: result.message })
      } else {
        logger.error({ error: result.message })
      }
    })
    return { ...acc, [job.id]: createdJob }
  }, {})

  cronjobs["enrollment-limbo"] = cron.schedule('0 2 * * *', refreshEntriesCron)
  cronjobs["delete-old-entries"] = cron.schedule('0 8 * * 1', deleteOldEntries)  // Every monday 08:00
}

const activateJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  if (cronjobs[id]) cronjobs[id].destroy() // Delete old job to prevent duplicates.

  const createdJob = cron.schedule(job.schedule, async () => {
    const timestamp = new Date(Date.now())
    logger.info(
      `${timestamp.toLocaleString()} Processing new ${course.name} (${
        course.courseCode
      }) completions.`
    )

    let result = ""

    if (EOAI_CODES.includes(course.courseCode)) {
      result = await processEoaiEntries({ grader })
    } else if (BAI_INTERMEDIATE_CODE === course.courseCode) {
      result = await processBaiIntermediateEntries({ job, course, grader })
    } else if (BAI_ADVANCED_CODE === course.courseCode) {
      result = await processBaiAdvancedEntries({ job, course, grader })
    } else {
      result = await processMoocEntries({ job, course, grader })
    }
    if (result.message === "no new entries" || result.message === "success") {
      logger.info({ message: result.message })
    } else {
      logger.error({ error: result.message })
    }
  })
  cronjobs = { ...cronjobs, [job.id]: createdJob }
}

const deactivateJob = async (id) => {
  if (cronjobs[id]) cronjobs[id].destroy()
}

module.exports = {
  initializeCronJobs,
  activateJob,
  deactivateJob
}
