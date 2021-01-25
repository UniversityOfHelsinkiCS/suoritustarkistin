const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/sisProcessManualEntry')
const { sisProcessMoocEntries } = require('../scripts/sisProcessMoocEntries')
const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
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

    processManualEntry({
      graderId,
      reporterId: req.user.id,
      courseId,
      date,
      data
    }, transaction)
      .then(async () => {
        await transaction.commit()
        logger.info({message: 'Successful CSV insert', sis: true})
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch(async (error) => {
        logger.error({message: `Unsuccessful CSV insert: ${error}`, error, sis: true})
        await transaction.rollback()
        return res.status(400).json({ error: error.toString() })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}


const addMoocRawEntries = async (req, res) => {
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

    sisProcessMoocEntries({
      graderId,
      courseId
      // course-slug
    }, transaction)
      .then(async () => {
        await transaction.commit()
        logger.info('Report of new completions created successfully.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch(async (error) => {
        logger.error({message: `Processing new completions failed: ${error}`, error, sis: true})
        await transaction.rollback()
        return res.status(400).json({ error: error.toString() })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

module.exports = {
  addRawEntries,
  addMoocRawEntries
}