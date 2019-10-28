const logger = require('@utils/logger')
const db = require('../models/index')

const cleanCourses = (courses) => {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    courseCode: course.courseCode,
    language: course.language,
    credits: course.credits,
    isMooc: course.isMooc
  }))
}

const getCourses = async (req, res) => {
  try {
    const courses = await db.courses.findAll()
    res.status(200).json(cleanCourses(courses))
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const getUsersCourses = async (req, res) => {
  try {
    const courses = await db.courses.findAll({
      where: { graderId: req.user.id }
    })
    res.status(200).json(cleanCourses(courses))
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const addCourse = async (req, res) => {
  const course = req.body
  const newCourse = await db.courses.create(course)
  res.status(200).json(newCourse)
}

const deleteAllCourses = async (req, res) => {
  await db.courses.destroy({ where: {} })
  res.status(204).end()
}

module.exports = {
  getCourses,
  getUsersCourses,
  addCourse,
  deleteAllCourses
}
