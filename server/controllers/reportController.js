const reportsRouter = require('express').Router()
const logger = require('@utils/logger')
const db = require('../models/index')
const { checkSuotarToken, checkCSVToken } = require('../utils/middleware')
const { processManualEntry } = require('../scripts/processManualEntry')

const handleDatabaseError = (res, error) => {
  logger.error(error)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const getCourseName = (data) => {
  const hackySplit = data.split('#')
  return hackySplit[4] || 'Unnamed course'
}

reportsRouter.post('/', checkCSVToken, async (req, res) => {
  try {
    const { courseId, graderId, date, data } = req.body
    if (!courseId || !graderId || !date || !data) {
      logger.error('Unsuccessful upload: missing form fields')
      return res.status(400).json({ error: 'invalid form values' })
    }

    processManualEntry({
      data,
      courseId,
      graderId,
      date
    })
      .then(() => {
        logger.info('Successful CSV insert.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch((err) => {
        logger.error('Unsuccessful CVS insert:', err.message)
        return res.status(400).json({ error: err.message })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
})

reportsRouter.get('/list', checkSuotarToken, async (req, res) => {
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
})

reportsRouter.get('/undownloaded', checkSuotarToken, async (req, res) => {
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
})

reportsRouter.get('/:id', checkSuotarToken, async (req, res) => {
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
})

module.exports = reportsRouter
