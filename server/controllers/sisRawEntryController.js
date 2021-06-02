const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/sisProcessManualEntry')
const sendEmail = require('../utils/sendEmail')
const { newReport } = require('../utils/emailFactory')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.toString() })
}

const addRawEntries = async (req, res) => {

  try {
    const transaction = await db.sequelize.transaction()
    if (!req.user.isGrader && !req.user.isAdmin) {
      throw new Error('User is not authorized to report credits.')
    }

    const { courseId, graderId, date, data } = req.body
    if (!courseId || !graderId || !data) {
      logger.error({ message: 'Unsuccessful upload: missing form fields', user: req.user.name, courseId, graderId, date })
      return res.status(400).json({ error: 'invalid form values' })
    }

    logger.info({ message: 'Raw sis entries', data: JSON.stringify(req.body) })

    const result = await processManualEntry({
      graderId,
      reporterId: req.user.id,
      courseId,
      date: date ? date: new Date(),
      data
    }, transaction)

    if (result.message === "success") {
      await transaction.commit()
      logger.info({ message: 'Report of new completions created successfully.' })
      const rawEntries = await db.raw_entries.findAll({
        where: { batchId: result.batchId },
        include: [{ model: db.entries, as: 'entry' }]
      })
      const withEnrollment = rawEntries.filter(({ entry }) => !entry.missingEnrolment).length
      if (withEnrollment) {
        const unsent = await db.entries.getUnsentBatchCount()
        sendEmail({
          subject: `Uusia kurssisuorituksia: ${result.courseCode}`,
          attachments: [{
            filename: 'suotar.png',
            path: `${process.cwd()}/client/assets/suotar.png`,
            cid: 'toskasuotarlogoustcid'
          }],
          html: newReport(withEnrollment, unsent, result.courseCode, result.batchId)
        })
      }
      return res.status(200).json({ message: 'report created successfully', isMissingEnrollment: result.isMissingEnrollment  })
    } else {
      await transaction.rollback()
      logger.error({ message: `Processing new completions failed` })
      return res.status(400).json({ message: "Processing new completions failed", failed: result.failed })
    }
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  addRawEntries
}