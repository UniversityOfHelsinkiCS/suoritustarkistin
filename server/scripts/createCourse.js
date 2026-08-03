const logger = require('@server/utils/logger')
const { isValidCourse } = require('@shared/validators')
const db = require('../models/index')

const createCourse = async (course) => {
  if (!isValidCourse(course)) throw new Error('Course details are not valid')
  const newCourse = await db.courses.create(course)
  logger.info(`New course created "${newCourse.courseCode}: ${newCourse.name}`)
  return newCourse
}

module.exports = { createCourse }
