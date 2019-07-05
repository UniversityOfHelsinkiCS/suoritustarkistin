const logger = require('@utils/logger')
const db = require('../models/index')

const getCourses = async (req, res) => {
  try {
    const courses = await db.courses.findAll()
    const cleanedCourses = courses.map((course) => ({
      id: course.id,
      name: course.name,
      courseCode: course.courseCode,
      language: course.language,
      credits: course.credits
    }))
    res.status(200).json(cleanedCourses)
  } catch (e) {
    logger.error(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addCourse = async (req, res) => {
  const course = req.body
  const newCourse = await db.courses.create(course)
  res.status(200).json(newCourse)
}

module.exports = {
  getCourses,
  addCourse
}
