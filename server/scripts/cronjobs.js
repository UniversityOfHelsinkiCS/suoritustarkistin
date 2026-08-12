const cron = require('node-cron')
const logger = require('@server/utils/logger')
const db = require('../models/index')
const { chooseScript } = require('./chooseAutomatedScript')
const refreshEntriesCron = require('./refreshEntryCron')
const sendEmailAboutUnsentEntries = require('./unsentEntriesEmailCron')

let cronjobs = {}

const initializeCronJobs = async () => {
  logger.info({ message: 'Initializing cronjobs' })

  const jobs = await db.jobs.findAll({
    where: { active: true }
  })

  logger.info({ message: JSON.stringify(jobs, null, 2) })

  cronjobs = jobs.reduce((acc, job) => ({ ...acc, [job.id]: cron.schedule(job.schedule, () => runJob(job.id)) }), {})

  cronjobs['enrollment-limbo'] = cron.schedule('0 2 * * *', refreshEntriesCron)
  cronjobs['send-email-about-unsent-entries'] = cron.schedule('0 9 * * 2', sendEmailAboutUnsentEntries)
}

const runJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  if (!job) {
    const message = `Cronjob ${id} fired but no longer exists, skipping.`
    logger.error({ message })
    return { ok: false, message }
  }

  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  if (!course || !grader) {
    const message = `Cronjob ${id} fired but ${course ? `grader ${job.graderId}` : `course ${job.courseId}`} was not found, skipping.`
    logger.error({ message })
    return { ok: false, message }
  }

  const timestamp = new Date(Date.now())
  logger.info(`${timestamp.toLocaleString()} Processing new ${course.name} (${course.courseCode}) completions.`)

  const script = chooseScript(course)
  const result = await script({ course, grader, job }, true)

  const succeeded = result.message === 'no new entries' || result.message === 'success'
  if (succeeded) {
    logger.info({ message: result.message })
  } else {
    logger.error({ message: result.message })
  }
  return { ok: succeeded, message: result.message }
}

const activateJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  if (!job) {
    logger.error({ message: `Cannot activate cronjob ${id}: no longer exists.` })
    return
  }

  if (cronjobs[id]) cronjobs[id].destroy() // Delete old job to prevent duplicates.

  cronjobs = { ...cronjobs, [job.id]: cron.schedule(job.schedule, () => runJob(job.id)) }
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
