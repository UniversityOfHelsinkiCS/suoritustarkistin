const cron = require('node-cron')
const logger = require('@utils/logger')
const db = require('../models/index')
const { chooseScript } = require('./chooseAutomatedScript')
const refreshEntriesCron = require('./refreshEntryCron')
const sendEmailAboutUnsentEntries = require('./unsentEntriesEmailCron')

let cronjobs = {}

const initializeCronJobs = async () => {
  logger.info({ message: 'Initialized cronjobs' })

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
      logger.info(`${timestamp.toLocaleString()} Processing new ${course.name} (${course.courseCode}) completions.`)

      const script = chooseScript(course)
      const result = await script({ course, grader, job }, true)

      if (result.message === 'no new entries' || result.message === 'success') {
        logger.info({ message: result.message })
      } else {
        logger.error({ error: result.message })
      }
    })
    return { ...acc, [job.id]: createdJob }
  }, {})

  cronjobs['enrollment-limbo'] = cron.schedule('0 2 * * *', refreshEntriesCron)
  cronjobs['send-email-about-unsent-entries'] = cron.schedule('0 9 * * 2', sendEmailAboutUnsentEntries)
}

const runJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  const script = chooseScript(course)

  const result = await script({ course, grader, job }, true)

  console.log('result', result)

  if (result.message === 'no new entries' || result.message === 'success') {
    logger.info({ message: result.message })
  } else {
    logger.error({ error: result.message })
  }
}

const activateJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  if (cronjobs[id]) cronjobs[id].destroy() // Delete old job to prevent duplicates.

  const createdJob = cron.schedule(job.schedule, async () => {
    const timestamp = new Date(Date.now())
    logger.info(`${timestamp.toLocaleString()} Processing new ${course.name} (${course.courseCode}) completions.`)

    const script = chooseScript(course)
    const result = await script({ course, grader, job }, true)

    if (result.message === 'no new entries' || result.message === 'success') {
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
  deactivateJob,
  runJob
}
