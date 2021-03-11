const logger = require('@utils/logger')
const db = require('../models/index')
const { isValidCourse } = require('@root/utils/validators')

const createCourse = async (course) => {
  if (!isValidCourse(course)) throw new Error({ message: "Course details are not valid" })
  const newCourse = await db.courses.create(course)
  logger.info(`New course created "${newCourse.courseCode}: ${newCourse.name}`)
  return newCourse
}

module.exports = { createCourse }