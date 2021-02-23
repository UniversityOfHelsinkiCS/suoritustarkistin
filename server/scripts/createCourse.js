const logger = require('@utils/logger')
const db = require('../models/index')
const { isValidCourse } = require('@root/utils/validators')

const createCourse = async (course) => {
  try {
    if (!isValidCourse(course)) return { error: "Course details are not valid"}
    const newCourse = await db.courses.create(course)
    return newCourse
  } catch (e) {
    logger.error(e.message)
    return { error: e.message }
  }
}

module.exports = { createCourse }