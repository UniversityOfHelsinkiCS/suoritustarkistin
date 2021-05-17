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
    if (!courseId || !graderId || !date || !data) {
      logger.error({ message: 'Unsuccessful upload: missing form fields', user: req.user.name, courseId, graderId, date, sis: true })
      return res.status(400).json({ error: 'invalid form values' })
    }

    const result = await processManualEntry({
      graderId,
      reporterId: req.user.id,
      courseId,
      date,
      data
    }, transaction)

    if (result.message === "success") {
      await transaction.commit()
      logger.info({ message: 'Report of new completions created successfully.', sis: true })
      const unsent = await db.entries.getUnsentBatchCount()
      if (await shouldSendEmail(result.batchId))
        sendEmail({
          subject: `Uusia kurssisuorituksia: ${result.courseCode}`,
          attachments: [{
            filename: 'suotar.png',
            path: `${process.cwd()}/client/assets/suotar.png`,
            cid: 'toskasuotarlogoustcid'
          }],
          html: newReport(result.success.length, unsent, result.courseCode, result.batchId)
        })
      return res.status(200).json({ message: 'report created successfully' })
    } else {
      await transaction.rollback()
      logger.error({ message: `Processing new completions failed`, sis: true })
      return res.status(400).json({ message: "Processing new completions failed", failed: result.failed })
    }
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

async function shouldSendEmail(batchId) {
  const rawEntries = await db.raw_entries.findAll({
    where: { batchId },
    include: [{ model: db.entries, as: 'entry' }],
    raw: true
  })
  return rawEntries.some(({ entry }) => !entry.missingEnrolment)
}

module.exports = {
  addRawEntries
}