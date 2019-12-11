const logger = require('@utils/logger')
const db = require('../models/index')

const cleanCourses = (courses) => {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    courseCode: course.courseCode,
    language: course.language,
    credits: course.credits,
    isMooc: course.isMooc,
    autoSeparate: course.autoSeparate,
    graderId: course.graderId
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
  // VALIDATION!
  try {
    const course = req.body
    const newCourse = await db.courses.create(course)
    res.status(200).json(newCourse)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const editCourse = async (req, res) => {
  // VALIDATION!
  try {
    const course = req.body
    const [rows, [updatedCourse]] = await db.courses.update(course, {
      returning: true,
      where: { id: req.params.id }
    })
    if (rows) return res.status(200).json(updatedCourse)
    return res.status(400).json({ error: 'id not found.' })
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

const deleteAllCourses = async (req, res) => {
  await db.courses.destroy({ where: {} })
  res.status(204).end()
}

const deleteCourse = async (req, res) => {
  await db.courses.destroy({ where: { id: req.params.id } })
  return res.status(200).json({ id: req.params.id })
}

module.exports = {
  getCourses,
  getUsersCourses,
  addCourse,
  editCourse,
  deleteAllCourses,
  deleteCourse
}
