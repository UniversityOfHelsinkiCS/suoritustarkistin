const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./processEntries')
const sendEmail = require('../utils/sendEmail')
const { newAutoReport } = require('../utils/emailFactory')
const { sendSentryMessage } = require('@utils/sentry')

const automatedAddToDb = async (matches, course, batchId, sendMail = true) => {
  const transaction = await db.sequelize.transaction()

  if (!matches.length) {
    return { message: 'no new entries' }
  }

  try {
    const newRawEntries = await db.raw_entries.bulkCreate(matches, transaction, { returning: true })
    logger.info({
      message: `${matches.length} new raw entries created`,
      amount: newRawEntries.length,
      course: course.courseCode,
      batchId
    })

    const checkStudyRights = true
    const requireEnrollment = true
    const [failed, success] = await processEntries(newRawEntries, requireEnrollment, checkStudyRights)

    if (failed.length) {
      logger.info({ message: `${failed.length} entries failed` })
      for (const failedEntry of failed) {
        logger.info({ message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}` })
        await db.raw_entries.destroy({
          where: {
            id: failedEntry.id
          }
        })
      }
    }

    if (!success || !success.length) {
      await transaction.rollback()
      logger.info('Job run ended successfully, no new entries created')
      return { message: "no new entries" }
    }

    await db.entries.bulkCreate(success, { transaction })
    logger.info({ message: `${success.length} new entries created`, amount: success.length })
    await transaction.commit()

    if (sendMail) {
      const unsent = await db.entries.getUnsentBatchCount()
      sendEmail({
        subject: 'Uusia automaattisesti luotuja suorituksia valmiina lähetettäväksi Sisuun!',
        html: newAutoReport(success.length, unsent, course.courseCode, batchId),
        attachments: [{
          filename: 'suotar.png',
          path: `${process.cwd()}/client/assets/suotar.png`,
          cid: 'toskasuotarlogoustcid'
        }]
      })
    }

    return { message: "success" }
  } catch (error) {
    await transaction.rollback()
    await db.raw_entries.destroy({
      where: {
        batchId: batchId
      }
    })
    logger.error(`Error processing new completions: ${error.message}`)
    sendSentryMessage(`Error processing new completions: ${error.message}`, null, error)
    return { message: `Error processing new completions: ${error.message}` }
  }
}

module.exports = { automatedAddToDb }