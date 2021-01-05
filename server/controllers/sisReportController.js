const logger = require('@utils/logger')
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const api = require('../config/importerApi')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const sisGetAllReports = async (req, res) => {
  try {
    const allRawEntries = await db.raw_entries.findAll({
      include: [{model: db.entries, as: 'entry', include: ['sender']}],
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(allRawEntries)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisGetUsersReports = async (req, res) => {
  try {
    const usersRawEntries = await db.raw_entries.findAll({
      where: { graderId: req.user.id },
      include: [{model: db.entries, as: 'entry', include: ['sender']}],
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(usersRawEntries)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisDeleteSingleEntry = async (req, res) => {
  try {
    db.raw_entries.destroy({
      where: {
        id: req.params.id
      }
    })
    return res.status(200).json({ id: req.params.id })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

/**
 * Send entries to Sisu using importer-db-api.
 * Request body should contain a list of entry ids to be sent to Sisu.
 */
const sendToSis = async (req, res) => {
  if (!req.user.isGrader && !req.user.isAdmin) {
    throw new Error('User is not authorized to report credits.')
  }

  const entryIds = req.body
  const entries = await db.entries.findAll({
    where: {
      id: { [Op.in]: entryIds }
    },
    include: ['rawEntry'],
    raw: true,
    nest: true
  })
  const senderId = req.user.id

  const data = entries.map((entry) => {
    const {
      personId,
      verifierPersonId,
      courseUnitRealisationId,
      assessmentItemId,
      completionDate,
      completionLanguage,
      courseUnitId,
      gradeScaleId,
      gradeId,
      rawEntry
    } = entry

    return {
      personId,
      verifierPersonId,
      courseUnitRealisationId,
      assessmentItemId,
      completionDate,
      completionLanguage,
      courseUnitId,
      gradeScaleId,
      gradeId,
      credits: parseFloat(rawEntry.credits)
    }
  })

  // TODO: Handle possible error from api and save errors to entries
  try {
    await api.post('suotar/', data)
  } catch (e) {
    throw new Error(e.toString())
  }

  // In updated entries The first element is always the number of affected rows,
  // while the second element is the actual affected rows.
  const updatedEntries = await db.entries.update({
    sent: new Date(),
    senderId
  }, {
    where: {
      id: { [Op.in]: entryIds }
    },
    returning: true
  })
  const updatedWithRawEntries = await db.raw_entries.findAll({
    where: {
      '$entry.id$': { [Op.in]: updatedEntries[1].map(({id}) => id) }
    },
    include: [{model: db.entries, as: 'entry', include: ['sender']}]
  })


  return res.status(200).json(updatedWithRawEntries)
}

module.exports = {
  sisGetAllReports,
  sisGetUsersReports,
  sisDeleteSingleEntry,
  sendToSis
}