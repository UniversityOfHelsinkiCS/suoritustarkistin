const logger = require('@utils/logger')
const db = require('../models/index')
const { getRegistrations } = require('../services/eduweb')

const getCourseRegistrations = async (req, res) => {
  try {
    const course = await db.courses.findOne({ where: { id: req.params.id } })
    if (!req.user.isAdmin && req.user.id !== course.graderId)
      return res.status(403).end()
    if (course.courseCode.substring(0, 2) !== 'AY') return res.status(404).end()

    const registrations = await getRegistrations(course.courseCode)
    res.status(200).json(registrations)
  } catch (e) {
    logger.error(e.message)
    res.status(500).json({ error: 'server went BOOM!' })
  }
}

module.exports = {
  getCourseRegistrations
}
