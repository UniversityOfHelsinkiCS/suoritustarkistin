const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/sisProcessManualEntry')
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
      logger.error({message: 'Unsuccessful upload: missing form fields', user: req.user.name, courseId, graderId, date, sis: true})
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
      logger.info({ message: 'Report of new completions created successfully.', sis: true})
      return res.status(200).json({ message: 'report created successfully' })
    } else {
      await transaction.rollback()
      logger.error({ message: `Processing new completions failed`, sis: true})
      return res.status(400).json({ message: "Processing new completions failed", failed: result.failed })
    }
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  addRawEntries,
}