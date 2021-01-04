const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/sisProcessManualEntry')

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
      logger.error('Unsuccessful upload: missing form fields')
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
        logger.info('Successful CSV insert.')
        return res.status(200).json({ message: 'report created successfully' })
      })
      .catch(async (error) => {
        logger.error('Unsuccessful CSV insert:', error)
        await transaction.rollback()
        return res.status(400).json({ error: error.toString() })
      })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

/*
TO BE TESTED AND WORKED ON
const getSingleRawEntry = async (req, res) => {
  try {
    const rawEntry = await db.raw_entries.findOne({
      where: {
        id: req.params.id
      },
      raw: true
    })

    if (rawEntry) {
      db.reports.update(
        {
          ...rawEntry,
          lastDownloaded: db.sequelize.fn('NOW')
        },
        { where: { id: rawEntry.id } }
      )
      return res.status(200).json(rawEntry)
    }
    return res.status(404).json({ error: 'Report not found.' })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

*/
module.exports = {
  addRawEntries
}