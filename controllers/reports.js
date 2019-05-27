const reportsRouter = require('express').Router()
const db = require('../models/index')
const { checkToken } = require('../utils/middleware')

const handleDatabaseError = () => {
  return res.status(500).json({ error: 'server went BOOM!' })
}

reportsRouter.get('/undownloaded', checkToken, async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      where: {
        lastDownloaded: null
      }
    })
    const reportFileNames = fetchedReports.map((report) => {
      return {
        id: report.id,
        fileName: report.fileName
      }
    })
    return res.status(200).send(reportFileNames)
  } catch (error) {
    console.log(error)
    handleDatabaseError()
  }
})

reportsRouter.get('/:id', checkToken, async (req, res) => {
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
    } else {
      return res.status(404).json({ error: 'Report not found.' })
    }
  } catch (error) {
    console.log(error)
    handleDatabaseError()
  }
})

module.exports = reportsRouter
