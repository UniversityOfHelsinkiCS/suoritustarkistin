const { getUnsentBatchIds } = require('../controllers/reportController')
const sendEmail = require('../utils/sendEmail')
const { unsentEntriesTemplate } = require('../utils/emailFactory')

const sendEmailAboutUnsentEntries = async () => {
  if (process.env.NODE_ENV !== 'production') return

  const batchIds = await getUnsentBatchIds()

  if (!batchIds.length) return

  sendEmail({
    to: 'Toska <grp-toska@helsinki.fi>',
    cc: null,
    replyTo: 'Toska <grp-toska@helsinki.fi>',
    subject: 'Unsent entries in Suotar',
    html: unsentEntriesTemplate(batchIds),
    attachments: [
      {
        filename: 'suotar.png',
        path: `${process.cwd()}/client/assets/suotar.png`,
        cid: 'toskasuotarlogoustcid'
      }
    ]
  })
}

module.exports = sendEmailAboutUnsentEntries
