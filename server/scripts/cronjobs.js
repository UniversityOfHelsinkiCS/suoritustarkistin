const cron = require('node-cron')
const db = require('../models/index')
const logger = require('@utils/logger')
const processMoocCompletions = require('./processMoocCompletions')

const createCronJobs = async () => {
  const jobs = await db.jobs.findAll({
    /*  include: [
      {
        model: db.users,
        as: 'user',
      },
      {
        model: db.courses,
        as: 'course',
      },
    ], */
  })
  jobs.forEach((job) => {
    cron.schedule(job.schedule, () => {
      const timestamp = new Date(Date.now())
      logger.info(`${timestamp.toLocaleString()} nodecron: Pretending: `)
      logger.info(
        `${timestamp.toLocaleString()} nodecron: Processing new ${
          job.course.name
        } completions.`
      )

      // TODO: implement actual cron scheduling
    })
  })
}

module.exports = createCronJobs
