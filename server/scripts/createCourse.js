const logger = require('@utils/logger')
const db = require('../models/index')
const { isValidCourse } = require('@root/utils/validators')

const createCourse = async (course) => {
  try {
    if (!isValidCourse(course)) return false

    const newCourse = await db.courses.create(course)
    return newCourse
  } catch (e) {
    logger.error(e.message)
    return false
  }
}

module.exports = { createCourse }