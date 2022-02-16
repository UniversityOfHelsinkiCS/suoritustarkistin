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
  const timestamp = moment().subtract(1, 'week').toDate()
  const entries = await db.entries.findAll({
    where: {
      courseUnitId: { [Op.not]: null },
      courseUnitRealisationId: { [Op.not]: null },
      assessmentItemId: { [Op.not]: null },
      sent: null,
      createdAt: { [Op.lte]: timestamp }
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

  const extraEntries = await db.extra_entries.findAll({
    where: {
      sent: null,
      createdAt: {
        [Op.lte]: timestamp
      }
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
  if (!entries.length && !extraEntries.length) return

  const rawEntryIds = entries.map(({ rawEntry }) => rawEntry.id).concat(extraEntries.map(({ rawEntry }) => rawEntry.id))

  logger.info({ message: `Deleting ${rawEntryIds.length} unset entries`, entries: { ...entries }, extraEntries: { ...extraEntries }, entriesBackup: JSON.stringify(entries.concat(extraEntries)) })
  sendSentryMessage(`Deleting ${rawEntryIds.length} unset entries`, null, { entries: JSON.stringify(entries.concat(extraEntries)) })

  const deletedAmount = await db.raw_entries.destroy({
    where: { id: { [Op.in]: rawEntryIds } }
  })
  logger.info(`Deleted ${deletedAmount} raw entries`)
  return deletedAmount
}

module.exports = deleteUnsent
