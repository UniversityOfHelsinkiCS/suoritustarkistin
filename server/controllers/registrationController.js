const logger = require('@utils/logger')
const db = require('../models/index')
const { getRegistrations } = require('../services/eduweb')

const getCourseRegistrations = async (req, res) => {
  try {
    const course = await db.courses.findOne({
      where: { id: req.params.id },
      include: ['graders']
    })
    if (!req.user.isAdmin && !course.graders.map(({ id }) => id).includes(req.user.id))
      return res.status(403).end()
    if (!course.autoSeparate) return res.status(404).end()

    let courseCode = course.courseCode

    if (course.autoSeparate) {
      const courses = course.courseCode.split('+')
      courseCode = courses[0] ? courses[0].trim() : undefined
    }

    const registrations = await getRegistrations(courseCode)
    res.status(200).json(registrations)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: e.message })
  }
}

module.exports = {
  getCourseRegistrations
}
