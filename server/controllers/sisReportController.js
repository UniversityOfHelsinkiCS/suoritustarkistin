const logger = require('@utils/logger')
const db = require('../models/index')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const sisGetAllReports = async (req, res) => {
  try {
    const rawEntriesBatchInfo = await db.raw_entries.findAll({
      order: [['createdAt', 'DESC']]
      // include: ['entries'] (Once the relation between entries 
      // and raw entries exists, this should bring the entries as well it)
    })
    return res.status(200).send(rawEntriesBatchInfo)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisGetUsersReports = async (req, res) => {
  try {
    const rawEntries = await db.raw_entries.findAll({
      where: { graderId: req.user.id },
      order: [['createdAt', 'DESC']]
      // include: ['entries'] (Once the relation between entries 
      // and raw entries exists, this should bring the entries as well it)
    })
    return res.status(200).send(rawEntries)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}


module.exports = {
  sisGetAllReports,
  sisGetUsersReports
}