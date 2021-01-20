const logger = require('@utils/logger')
const db = require('../models/index')
const { manualRun, activateJob, deactivateJob } = require('../scripts/cronjobs')
const { sisProcessMoocEntries } = require('../scripts/sisProcessMoocEntries')
const { sisProcessEoaiEntries } = require('../scripts/sisProcessEoaiEntries')
// const { sisProcessBaiEntries } = require('../scripts/sisProcessBaiEntries')
const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

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
    const transaction = await db.sequelize.transaction()
    if (!req.user.isAdmin) {
      throw new Error('User is not authorized to create SIS-reports.')
    }

    const jobId = req.params.id
    const job = await db.jobs.findOne({ where: { id: jobId }})
    const course = await db.courses.findOne({ where: { id: job.courseId }})
    const grader = await db.users.findOne({ where: { id: course.graderId } })

    const timeStamp = new Date(Date.now())

    logger.info(
      `${timeStamp.toLocaleString()} Manual sis-job run: Processing new ${course.name} (${
        course.courseCode
      }) completions`
    )

    sisProcessMoocEntries({
      graderId: grader.employeeId,
      courseId: course.id,
      slug: job.slug
    }, transaction)
      .then(async () => {
        await transaction.commit()
        logger.info('Successful job run, report created successfully.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch(async (error) => {
        logger.error('Unsuccessful job run: ', error)
        await transaction.rollback()
        return res.status(400).json({ error: error.toString() })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}


const sisRunEaoiJob = async (req, res) => {
  try {
    const transaction = await db.sequelize.transaction()
    if (!req.user.isAdmin) {
      throw new Error('User is not authorized to create SIS-reports.')
    }

    const jobId = req.params.id
    const job = await db.jobs.findOne({ where: { id: jobId }})
    const course = await db.courses.findOne({ where: { id: job.courseId }})
    const grader = await db.users.findOne({ where: { id: course.graderId } })

    const timeStamp = new Date(Date.now())

    logger.info(
      `${timeStamp.toLocaleString()} Manual sis-job run: Processing new ${course.name} (${
        course.courseCode
      }) completions`
    )
    sisProcessEoaiEntries({
      graderId: grader.employeeId
    }, transaction)
      .then(async () => {
        await transaction.commit()
        logger.info('Successful job run, report created successfully.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch(async (error) => {
        logger.error('Unsuccessful job run: ', error)
        await transaction.rollback()
        return res.status(400).json({ error: error.toString() })
      })
  } catch (error) {
    handleDatabaseError(res, error)
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
  sisRunJob,
  sisRunEaoiJob
}
