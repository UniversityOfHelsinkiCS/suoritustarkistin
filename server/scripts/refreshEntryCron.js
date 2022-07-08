const { Op, col } = require('sequelize')
const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')
const db = require('../models/index')
const refreshEntries = require("./refreshEntries")
const attainmentsToSisu = require('../utils/sendToSisu')

const refreshEntriesCron = async () => {
  logger.info({ message: `Refreshing entries automatically` })
  const rawEntries = await db.entries.findAll({
    where: {
      [Op.or]: [{ courseUnitId: null }, { courseUnitRealisationId: null }, { assessmentItemId: null }]
    },
    include: [{ model: db.raw_entries, as: 'rawEntry', attributes: [] }],
    attributes: [[col('rawEntry.id'), 'id']],
    raw: true
  })
  const rawEntryIds = rawEntries.map(({ id }) => id)
  const [amount, batchId] = await refreshEntries(rawEntryIds)
  logger.info({ message: `${amount} entries refreshed successfully.`, batchId })

  if (!amount) return
  sendSentryMessage(`${amount} new enrollments found. New batch created with id ${batchId}`)

  const entriesToSend = await db.entries.findAll({
    where: {
      '$rawEntry.batchId$': batchId
    },
    attributes: [[col('entries.id'), 'id']],
    include: [{ model: db.raw_entries, as: 'rawEntry', attributes: [] }],
    raw: true
  })
  const [status, message] = await attainmentsToSisu('entries', {
    user: {},
    body: { entryIds: entriesToSend.map(({ id }) => id) }
  })
  if (status > 200) return sendSentryMessage(`Sending enrollment limbo entries to Sisu failed with message: ${message}`)
  return sendSentryMessage('Successfully sent enrollment limbo entries to Sisu!')
}

module.exports = refreshEntriesCron
