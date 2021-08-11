const moment = require('moment')
const { Op } = require("sequelize")
const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')

const db = require('../models/index')


/**
 * Delete 30 days old entries with missing enrollment and a failing grade 
 */
const deleteOldEntries = async () => {
  const monthAgo = moment().startOf('day').subtract(1, 'month').toDate()
  const entries = await db.entries.findAll({
    where: {
      [Op.or]: [
        { courseUnitId: null },
        { courseUnitRealisationId: null },
        { assessmentItemId: null }
      ],
      createdAt: { [Op.lte]: monthAgo }
    },
    include: [{
      model: db.raw_entries,
      as: 'rawEntry',
      attributes: ['id', 'grade', 'credits'],
      include: [{
        model: db.courses,
        as: 'course',
        attributes: ['name', 'courseCode']
      }]
    }],
    nest: true,
    attributes: ['id', 'personId'],
    raw: true
  })
  const rawEntryIds = entries.map(({ rawEntry }) => rawEntry.id)

  logger.info({ message: `Deleting ${entries.length} old entries with missing enrollment and failing grade`, entries: { ...entries } })
  sendSentryMessage(`Deleting ${entries.length} old entries with missing enrollment and failing grade`, null, { ...entries })


  const deletedAmount = await db.raw_entries.destroy({
    where: { id: { [Op.in]: rawEntryIds } }
  })
  logger.info(`Deleted ${deletedAmount} raw entries`)
  return deletedAmount
}

module.exports = deleteOldEntries
