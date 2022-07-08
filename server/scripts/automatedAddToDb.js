const logger = require('@utils/logger')
const { sendSentryMessage } = require('@utils/sentry')
const db = require('../models/index')
const { processEntries } = require('./processEntries')
const attainmentsToSisu = require('../utils/sendToSisu')

const automatedAddToDb = async (matches, course, batchId, sendToSisu = false) => {
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

    const requireEnrollment = true
    const [failed, success] = await processEntries(newRawEntries, requireEnrollment)

    if (failed.length) {
      logger.info({ message: `${failed.length} entries failed` })
      // eslint-disable-next-line no-restricted-syntax
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
      return { message: 'no new entries' }
    }

    const entriesToSend = await db.entries.bulkCreate(success, { transaction, returning: true })
    logger.info({ message: `${success.length} new entries created`, amount: success.length })
    await transaction.commit()

    if (sendToSisu) {
      const [status, message] = await attainmentsToSisu('entries', {
        user: {},
        body: { entryIds: entriesToSend.map(({ id }) => id) }
      })
      if (status > 200) sendSentryMessage(`Sending automatedy entries to Sisu failed with message: ${message}`)
    }
    return { message: 'success' }
  } catch (error) {
    await transaction.rollback()
    await db.raw_entries.destroy({
      where: {
        batchId
      }
    })
    logger.error(`Error processing new completions: ${error.message}`)
    sendSentryMessage(`Error processing new completions: ${error.message}`, null, error)
    return { message: `Error processing new completions: ${error.message}` }
  }
}

module.exports = { automatedAddToDb }
