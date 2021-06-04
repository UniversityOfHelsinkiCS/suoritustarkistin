const db = require('../models/index')
const logger = require('@utils/logger')
const { EOAI_CODES, BAI_CODES } = require('@root/utils/validators')
const processMoocCompletions = require('./processMoocCompletions')
const processEoaiCompletions = require('./processEoaiCompletions')
const processBaiCompletions = require('./processBaiCompletions')

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

  if (EOAI_CODES.includes(course.courseCode)) {
    await processEoaiCompletions(grader)
  } else if (BAI_CODES.includes(course.courseCode)) {
    await processBaiCompletions(grader, course, job) 
  } else {
    await processMoocCompletions(
      course.courseCode,
      course.name,
      course.credits,
      grader.employeeId,
      course.language,
      job.slug
    )  
  }
}

module.exports = {
  manualRun
}
