const { getUnsentEntries } = require('../controllers/reportController')
const sendEmail = require('../utils/sendEmail')
const { unsentEntriesTemplate } = require('../utils/emailFactory')

const sendEmailAboutUnsentEntries = async () => {
  if (process.env.NODE_ENV !== 'production') return

  const entries = await getUnsentEntries()

  if (!entries.length) return

  const batchIds = [...new Set(entries.map((entry) => entry.rawEntry.batchId))]

  sendEmail({
    subject: 'Unsent entries in Suotar',
    attachments: [
      {
        filename: 'suotar.png',
        path: `${process.cwd()}/client/assets/suotar.png`,
        cid: 'toskasuotarlogoustcid'
      }
    ],
    html: unsentEntriesTemplate(batchIds),
    cc: process.env.CC_RECEIVER
  })
}

module.exports = sendEmailAboutUnsentEntries
