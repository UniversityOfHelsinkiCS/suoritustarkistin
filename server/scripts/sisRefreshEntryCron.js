const refreshEntries = require('../scripts/sisRefreshEntry')
const db = require('../models/index')
const { Op, col } = require("sequelize")
const logger = require('@utils/logger')
const sendEmail = require('../utils/sendEmail')
const { newLimboReport } = require('../utils/emailFactory')


const refreshEntriesCron = async () => {
  logger.info({ message: `Refreshing entries automatically`, sis: true })
  const rawEntries = await db.entries.findAll({
    where: {
      [Op.or]: [
        { courseUnitId: null },
        { courseUnitRealisationId: null },
        { assessmentItemId: null }
      ]
    },
    include: [{ model: db.raw_entries, as: 'rawEntry', attributes: [] }],
    attributes: [[col("rawEntry.id"), 'id']],
    raw: true
  })
  const rawEntryIds = rawEntries.map(({ id }) => id)
  const [amount, batchId] = await refreshEntries(rawEntryIds)
  logger.info({ message: `${amount} entries refreshed successfully.`, sis: true, batchId })

  if (!amount) return

  const unsent = await db.entries.getUnsentBatchCount()
  sendEmail({
    subject: 'Uusia suorituksia valmiina lähetettäväksi Sisuun!',
    html: newLimboReport(amount, batchId, unsent),
    attachments: [{
      filename: 'suotar.png',
      path: `${process.cwd()}/client/assets/suotar.png`,
      cid: 'toskasuotarlogoustcid'
    }]
  })
}

module.exports = refreshEntriesCron
