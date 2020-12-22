const logger = require('@utils/logger')
const db = require('../models/index')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const sisGetAllReports = async (req, res) => {
  try {
    const allRawEntries = await db.raw_entries.findAll({
      include:['entry'],
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
      include: ['entry'],
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

module.exports = {
  sisGetAllReports,
  sisGetUsersReports,
  sisDeleteSingleEntry
}