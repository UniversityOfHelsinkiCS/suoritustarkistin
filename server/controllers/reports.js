const reportsRouter = require('express').Router()
const db = require('../models/index')
const { checkSuotarToken, checkCSVToken } = require('../utils/middleware')
const { processCSV, processManualEntry } = require('../scripts/processCSV')

const handleDatabaseError = () => {
  return res.status(500).json({ error: 'server went BOOM!' })
}

const getCourseName = (data) => {
  const hackySplit = data.split('#')
  return hackySplit[4] || 'Unnamed course'
}

reportsRouter.post('/', checkCSVToken, async (req, res) => {
  try {
    const { courseId, graderId, date, data } = req.body
    if (!courseId || !graderId || !date || !data) {
      console.log('Unsuccessful CVS insert: missing form fields')
      return res.status(400).json({ error: 'invalid form values' })
    }

    processManualEntry({ data, courseId, graderId, date })
      .then(() => {
        console.log('Successful CSV insert.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch((err) => {
        console.log('Unsuccessful CVS insert:', err.message)
        return res.status(400).json({ error: err.message })
      })
  } catch (error) {
    console.log(error)
    handleDatabaseError()
  }
})

reportsRouter.get('/list', checkSuotarToken, async (req, res) => {
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

reportsRouter.get('/undownloaded', checkSuotarToken, async (req, res) => {
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
    } else {
      return res.status(404).json({ error: 'Report not found.' })
    }
  } catch (error) {
    console.log(error)
    handleDatabaseError()
  }
})

module.exports = reportsRouter
