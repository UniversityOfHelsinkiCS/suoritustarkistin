const logger = require('@utils/logger')
const db = require('../models/index')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.message })
}

const getOodiReports = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(fetchedReports)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getUsersOodiReports = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      where: { graderId: req.user.id },
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(fetchedReports)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  getOodiReports,
  getUsersOodiReports
}
