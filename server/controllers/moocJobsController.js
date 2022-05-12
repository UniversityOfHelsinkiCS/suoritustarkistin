const logger = require('@utils/logger')
const { isValidJob } = require('@root/utils/validators')
const db = require('../models/index')
const { activateJob, deactivateJob } = require('../scripts/cronjobs')
const { chooseScript } = require('../scripts/chooseAutomatedScript')

const getJobs = async (req, res) => {
  try {
    const jobs = await db.jobs.findAll()
    res.status(200).json(jobs)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

const addJob = async (req, res) => {
  try {
    const job = req.body

    if (!isValidJob(job)) return res.status(400).json({ error: 'Malformed cronjob data.' })

    const newJob = await db.jobs.create(job)
    if (newJob.active) await activateJob(newJob.id)
    res.status(200).json(newJob)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

const editJob = async (req, res) => {
  try {
    const job = req.body

    if (!isValidJob(job)) return res.status(400).json({ error: 'Malformed cronjob data.' })

    const [rows, [updatedJob]] = await db.jobs.update(job, {
      returning: true,
      where: { id: req.params.id }
    })

    if (rows) {
      updatedJob.active ? activateJob(updatedJob.id) : deactivateJob(updatedJob.id)
      return res.status(200).json(updatedJob)
    }
    return res.status(400).json({ error: 'id not found.' })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

const runJob = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(400).json({ error: 'User is not authorized to create mooc-reports.' })
    }
    const jobId = req.params.id

    const job = await db.jobs.findOne({
      where: {
        id: jobId
      }
    })
    if (!job) return res.status(400).json({ error: `No cronjob with id: ${jobId}` })

    const course = await db.courses.findOne({
      where: {
        id: job.courseId
      }
    })
    if (!course) return res.status(400).json({ error: `No course with id: ${job.courseId} found` })

    const grader = await db.users.findOne({
      where: {
        id: job.graderId
      }
    })
    if (!grader) return res.status(400).json({ error: `No grader found for the job: ${course.name}` })

    const timeStamp = new Date(Date.now())

    logger.info(
      `${timeStamp.toLocaleString()} Manual mooc-job run: Processing new ${course.name} (${
        course.courseCode
      }) completions`
    )
    const script = chooseScript(course.courseCode)
    const result = await script({ job, course, grader })

    if (result.message === 'no new entries' || result.message === 'success') {
      return res.status(200).json({ message: result.message })
    }

    return res.status(500).json({ error: result.message })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
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
  runJob
}
