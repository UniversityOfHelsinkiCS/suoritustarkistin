const logger = require('@utils/logger')
const db = require('../models/index')
const {
  manualRun,
  activateJob,
  deactivateJob,
  sisManualBaiRun,
  sisManualEaoiRun,
  sisManualRun
} = require('../scripts/cronjobs')

const { isValidJob } = require('@root/utils/validators')
const { EAOI_CODES, BAI_CODES } = require('../../utils/validators')

const getJobs = async (req, res) => {
  try {
    const jobs = await db.jobs.findAll()
    res.status(200).json(jobs)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addJob = async (req, res) => {
  try {
    const job = req.body

    if (!isValidJob(job))
      return res.status(400).json({ error: 'Malformed cronjob data.' })

    const newJob = await db.jobs.create(job)
    if (newJob.active) await activateJob(newJob.id)
    res.status(200).json(newJob)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const editJob = async (req, res) => {
  try {
    const job = req.body

    if (!isValidJob(job))
      return res.status(400).json({ error: 'Malformed cronjob data.' })

    const [rows, [updatedJob]] = await db.jobs.update(job, {
      returning: true,
      where: { id: req.params.id }
    })
    if (rows) {
      updatedJob.active
        ? activateJob(updatedJob.id)
        : deactivateJob(updatedJob.id)
      return res.status(200).json(updatedJob)
    }
    return res.status(400).json({ error: 'id not found.' })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const runJob = async (req, res) => {
  try {
    await manualRun(req.params.id)
    return res.status(200).json({ id: req.params.id })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const sisRunJob = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(400).json({ error: 'User is not authorized to create SIS-reports.' })
    }

    const transaction = await db.sequelize.transaction()
    const jobId = req.params.id

    const job = await db.jobs.findOne({
      where: {
        id: jobId
      }
    })

    if (!job) {
      return res.status(400).json({ error: `No cronjob with id: ${jobId}` })
    }

    const course = await db.courses.findOne({
      where: {
        id: job.courseId
      }
    })

    if (!course) {
      return res.status(400).json({ error: `No course with id: ${job.courseId} found`})
    }

    const grader = await db.users.findOne({
      where: {
        id: course.graderId
      }
    })

    if (!grader) {
      return res.status(400).json({ error: `No grader-employee found for the course: ${job.courseId}`})
    }

    let result = ""
    if (EAOI_CODES.includes(course.courseCode)) {
      result = await sisManualEaoiRun(course, grader, transaction)
    } else if (BAI_CODES.includes(course.courseCode)) {
      result = await sisManualBaiRun(job, course, grader, transaction)
    } else {
      result = await sisManualRun(job, course, grader, transaction)
    }
    return res.status(200).json({ result })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

const deleteAllJobs = async (req, res) => {
  await db.jobs.destroy({ where: {} })
  res.status(204).end()
}

const deleteJob = async (req, res) => {
  await db.jobs.destroy({ where: { id: req.params.id } })
  await deactivateJob(req.params.id)
  return res.status(200).json({ id: req.params.id })
}

module.exports = {
  getJobs,
  addJob,
  editJob,
  deleteJob,
  deleteAllJobs,
  runJob,
  sisRunJob
}
