const cron = require('node-cron')
const db = require('../models/index')
const logger = require('@utils/logger')
const processMoocCompletions = require('./processMoocCompletions')
const { sisProcessMoocEntries } = require('../scripts/sisProcessMoocEntries')
const { sisProcessEoaiEntries } = require('../scripts/sisProcessEoaiEntries')
const { sisProcessBaiEntries } = require('../scripts/sisProcessBaiEntries')

let cronjobs = {}

const initializeCronJobs = async () => {
  const jobs = await db.jobs.findAll({
    where: { active: true }
  })
  const courses = await db.courses.findAll({})
  const users = await db.users.findAll({})

  cronjobs = jobs.reduce((acc, job) => {
    const course = courses.find((c) => c.id === job.courseId)
    const grader = users.find((u) => u.id === job.graderId)

    const createdJob = cron.schedule(job.schedule, () => {
      const timestamp = new Date(Date.now())
      logger.info(
        `${timestamp.toLocaleString()} Processing new ${course.name} (${
          course.courseCode
        }) completions.`
      )
      processMoocCompletions(
        course.courseCode,
        course.name,
        course.credits,
        grader.employeeId,
        course.language,
        job.slug
      )
    })
    return { ...acc, [job.id]: createdJob }
  }, {})
}

const manualRun = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  const timestamp = new Date(Date.now())
  logger.info(
    `${timestamp.toLocaleString()} Manual run: Processing new ${course.name} (${
      course.courseCode
    }) completions.`
  )
  processMoocCompletions(
    course.courseCode,
    course.name,
    course.credits,
    grader.employeeId,
    course.language,
    job.slug
  )
}

const clearTransaction = async (result, transaction) => {
  if (result === "success") {
    logger.info('Job run ended successfully, new entries created')
    await transaction.commit()
  } else {
    await transaction.rollback()
    logger.info('Job run ended successfully, no new entries created')
  }

  return result
}

const sisManualRun = async (job, course, grader, transaction) => {
  const timeStamp = new Date(Date.now())
  logger.info(
    `${timeStamp.toLocaleString()} Manual sis-job run: Processing new ${course.name} (${
      course.courseCode
    }) completions`
  )
  
  await sisProcessMoocEntries({
    job,
    course,
    grader
  }, transaction)
    .then(async (response) => {
      return await clearTransaction(response.message, transaction)
    })
    .catch(async (error) => {
      logger.error('Unsuccessful job run: ', error)
      transaction.rollback()
      return error 
    })
}

const sisManualEaoiRun = async (course, grader, transaction) => {
  const timeStamp = new Date(Date.now())
  logger.info(
    `${timeStamp.toLocaleString()} Manual eaoi-sis-job run: Processing new ${course.name} (${
      course.courseCode
    }) completions`
  )

  await sisProcessEoaiEntries({
    grader
  }, transaction)
    .then(async (response) => {
      return await clearTransaction(response.message, transaction)
    })
    .catch(async (error) => {
      logger.error('Unsuccessful job run: ', error)
      await transaction.rollback()
      return error
    })
}

const sisManualBaiRun = async (job, course, grader, transaction) => {
  const timeStamp = new Date(Date.now())
  logger.info(
    `${timeStamp.toLocaleString()} Manual bai-sis-job run: Processing new ${course.name} (${
      course.courseCode
    }) completions`
  )

  await sisProcessBaiEntries({
    job,
    course,
    grader
  }, transaction)
    .then(async (response) => {
      return await clearTransaction(response.message, transaction)
    })
    .catch(async (error) => {
      logger.error('Unsuccessful job run: ', error)
      await transaction.rollback()
      return error
    })
}

const activateJob = async (id) => {
  const job = await db.jobs.findOne({ where: { id } })
  const course = await db.courses.findOne({ where: { id: job.courseId } })
  const grader = await db.users.findOne({ where: { id: job.graderId } })

  if (cronjobs[id]) cronjobs[id].destroy() // Delete old job to prevent duplicates.

  const createdJob = cron.schedule(job.schedule, () => {
    const timestamp = new Date(Date.now())
    logger.info(
      `${timestamp.toLocaleString()} Processing new ${course.name} (${
        course.courseCode
      }) completions.`
    )
    processMoocCompletions(
      course.courseCode,
      course.name,
      course.credits,
      grader.employeeId,
      course.language,
      job.slug
    )
  })
  cronjobs = { ...cronjobs, [job.id]: createdJob }
}

const deactivateJob = async (id) => {
  if (cronjobs[id]) cronjobs[id].destroy()
}

module.exports = {
  initializeCronJobs,
  manualRun,
  sisManualRun,
  sisManualBaiRun,
  sisManualEaoiRun,
  activateJob,
  deactivateJob
}
