const reportsRouter = require('express').Router()
const db = require('../models/index')
const { checkToken } = require('../utils/middleware')

const handleDatabaseError = () => {
  return res.status(500).json({ error: 'server went BOOM!' })
}

const getCourseName = (data) => {
  const hackySplit = data.split('#')
  return hackySplit[4] || 'Unnamed course'
}

reportsRouter.get('/list', checkToken, async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll()
    const reportFileInfo = fetchedReports.map((report) => {
      return {
        id: report.id,
        fileName: report.fileName,
        courseName: getCourseName(report.data)
      }
    })
    return res.status(200).send(reportFileInfo)
  } catch (error) {
    console.log(error)
    handleDatabaseError()
  }
})

reportsRouter.get('/undownloaded', checkToken, async (req, res) => {
  try {
    const fetchedReports = await db.reports.findAll({
      where: {
        lastDownloaded: null
      }
    })
    const reportFileInfo = fetchedReports.map((report) => {
      return {
        id: report.id,
        fileName: report.fileName,
        courseName: getCourseName(report.data)
      }
    })
    return res.status(200).send(reportFileInfo)
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
