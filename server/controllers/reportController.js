const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/processManualEntry')

const handleDatabaseError = (res, error) => {
  logger.error(error)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const getCourseName = (data) => {
  const hackySplit = data.split('#')
  return hackySplit[4] || 'Unnamed course'
}

const addReport = async (req, res) => {
  try {
    const { courseId, graderEmployeeId, date, data } = req.body
    if (!courseId || !graderEmployeeId || !date || !data) {
      logger.error('Unsuccessful upload: missing form fields')
      return res.status(400).json({ error: 'invalid form values' })
    }

    processManualEntry({
      data,
      courseId,
      graderEmployeeId,
      date
    })
      .then(() => {
        logger.info('Successful CSV insert.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch((err) => {
        logger.error('Unsuccessful CSV insert:', err.message)
        return res.status(400).json({ error: err.message })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getReportList = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll()
    const reportFileInfo = fetchedReports.map((report) => ({
      id: report.id,
      fileName: report.fileName,
      courseName: getCourseName(report.data)
    }))
    return res.status(200).send(reportFileInfo)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getNewReportList = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      where: {
        lastDownloaded: null
      }
    })
    const reportFileInfo = fetchedReports.map((report) => ({
      id: report.id,
      fileName: report.fileName,
      courseName: getCourseName(report.data)
    }))
    return res.status(200).send(reportFileInfo)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getReports = async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll()
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
    db.reports.destroy({ where: {} })
    return res.status(204).end()
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  addReport,
  getReportList,
  getNewReportList,
  getReports,
  getSingleReport,
  deleteAllReports
}
