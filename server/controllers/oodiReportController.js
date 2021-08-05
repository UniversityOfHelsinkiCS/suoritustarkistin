const logger = require('@utils/logger')
const db = require('../models/index')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const getReports = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(fetchedReports)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getUsersReports = async (req, res) => {
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

const getSingleReport = async (req, res) => {
  try {
    const fetchedReport = await db.reports.findOne({
      where: {
        id: req.params.id
      },
      raw: true
    })

    if (fetchedReport) {
      db.reports.update(
        {
          ...fetchedReport,
          lastDownloaded: db.sequelize.fn('NOW')
        },
        { where: { id: fetchedReport.id } }
      )
      return res.status(200).json(fetchedReport)
    }
    return res.status(404).json({ error: 'Report not found.' })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const deleteAllReports = async (req, res) => {
  try {
    await db.reports.destroy({ where: {} })
    return res.status(204).end()
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  getReports,
  getUsersReports,
  getSingleReport,
  deleteAllReports
}
