const logger = require('@utils/logger')
const db = require('../models/index')
const { isValidJob } = require('@root/utils/validators')

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
    if (rows) return res.status(200).json(updatedJob)
    return res.status(400).json({ error: 'id not found.' })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const runJob = async (req, res) => {
  try {
    logger.info(`Manual trigger for course ${req.params.id}`)
    res.status(200)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const deleteAllJobs = async (req, res) => {
  await db.jobs.destroy({ where: {} })
  res.status(204).end()
}

const deleteJob = async (req, res) => {
  await db.jobs.destroy({ where: { id: req.params.id } })
  return res.status(200).json({ id: req.params.id })
}

module.exports = {
  getJobs,
  addJob,
  editJob,
  deleteJob,
  deleteAllJobs,
  runJob
}
