const logger = require('@util/logger')
const db = require('../models/index')

const getCourses = async (req, res) => {
  try {
    const courses = await db.courses.findAll()
    const cleanedCourses = courses.map(course => ({
      id: course.id,
      name: course.name,
      courseCode: course.courseCode,
      language: course.language,
      credits: course.credits,
    }))
    res.status(200).json(cleanedCourses)
  } catch (e) {
    console.log(e)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

module.exports = {
  getCourses,
}
