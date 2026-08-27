const logger = require('@server/utils/logger')
const { sendSentryError } = require('@server/utils/sentry')
const db = require('../models/index')
const { processEntries } = require('./processEntries')
const attainmentsToSisu = require('../utils/sendToSisu')
const { filterDuplicateMatches } = require('../utils/earlierCompletions')
const { severityOf, summarizeReasons, failureMessage } = require('../utils/failureReasons')

const automatedAddToDb = async (allMatches, course, batchId, sendToSisu = false) => {
  const matches = filterDuplicateMatches(allMatches)

  if (!matches.length) {
    return { message: 'no new entries' }
  }

  const transaction = await db.sequelize.transaction()

  let entriesToSend
  try {
    const newRawEntries = await db.raw_entries.bulkCreate(matches, { transaction, returning: true })
    logger.info({
      message: `${matches.length} new raw entries created`,
      amount: newRawEntries.length,
      course: course.courseCode,
      batchId
    })

    const requireEnrollment = true
    const [failed, success] = await processEntries(newRawEntries, requireEnrollment)

    if (failed.length) {
      logger.info({ message: `${failed.length} entries failed`, reasons: summarizeReasons(failed) })
      for (const failedEntry of failed) {
        logger[severityOf(failedEntry)]({ message: failureMessage(failedEntry), reason: failedEntry.reason })
        await db.raw_entries.destroy({
          where: {
            id: failedEntry.id
          },
          transaction
        })
      }

      const errors = failed.filter((failedEntry) => severityOf(failedEntry) === 'error')
      if (errors.length)
        sendSentryError('Completions dropped from job run', null, {
          course: course.courseCode,
          batchId,
          errorAmount: errors.length,
          failedAmount: failed.length,
          totalAmount: newRawEntries.length,
          reasons: summarizeReasons(errors),
          messages: errors.map(failureMessage),
          rawEntries: errors.map(({ id }) => {
            const rawEntry = newRawEntries.find((entry) => entry.id === id)
            return rawEntry ? JSON.parse(JSON.stringify(rawEntry.get({ plain: true }))) : { id }
          })
        })
    }

    if (!success || !success.length) {
      await transaction.rollback()
      logger.info('Job run ended successfully, no new entries created')
      return { message: 'no new entries' }
    }

    entriesToSend = await db.entries.bulkCreate(success, { transaction, returning: true })
    logger.info({ message: `${success.length} new entries created`, amount: success.length })
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    logger.error(`Error processing new completions: ${error.message}`)
    // Stable title: the message varies per failure, which would group each one separately
    sendSentryError('Error processing new completions', error, { batchId })
    return { message: `Error processing new completions: ${error.message}` }
  }

  if (sendToSisu) {
    const failed = (reason, error) => {
      const message = `Entries created, but sending them to Sisu failed: ${reason}`
      logger.error(message)
      sendSentryError('Entries created, but sending them to Sisu failed', error, { reason })
      return { message }
    }

    try {
      const [status, body] = await attainmentsToSisu('entries', {
        user: {},
        body: { entryIds: entriesToSend.map(({ id }) => id) }
      })
      const { message } = body
      if (status > 200) return failed(typeof message === 'string' ? message : JSON.stringify(message))
    } catch (error) {
      return failed(error.message, error)
    }
  }
  return { message: 'success' }
}

module.exports = { automatedAddToDb }
