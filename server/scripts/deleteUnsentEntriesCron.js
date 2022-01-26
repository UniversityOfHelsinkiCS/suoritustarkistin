const moment = require('moment')
const { Op } = require("sequelize")
const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')

const db = require('../models/index')


/**
 * Delete unsent entries
 */
const deleteUnsent = async () => {
  // Exclude freshly created entries
  const timestamp = moment().subtract(2, 'hours').toDate()
  const entries = await db.entries.findAll({
    where: {
      [Op.and]: [
        { sent: null },
        {
          [Op.and]: [
            { '$entry.courseUnitId$': { [Op.not]: null } },
            { '$entry.courseUnitRealisationId$': { [Op.not]: null } },
            { '$entry.assessmentItemId$': { [Op.not]: null } }
          ]
        },
        { createdAt: { [Op.lte]: timestamp } }
      ]
    },
    include: [{
      model: db.raw_entries,
      as: 'rawEntry',
      include: [{
        model: db.courses,
        as: 'course'
      }]
    }],
    nest: true,
    raw: true
  })

  if (!entries.length) return

  const rawEntryIds = entries.map(({ rawEntry }) => rawEntry.id)

  logger.info({ message: `Deleting ${entries.length} unset entries`, entries: { ...entries }, entriesBackup: JSON.stringify(entries) })
  sendSentryMessage(`Deleting ${entries.length} unset entries`, null, { entries: JSON.stringify(entries) })

  const deletedAmount = await db.raw_entries.destroy({
    where: { id: { [Op.in]: rawEntryIds } }
  })
  logger.info(`Deleted ${deletedAmount} raw entries`)
  return deletedAmount
}

module.exports = deleteUnsent
