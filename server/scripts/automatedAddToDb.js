const logger = require('@server/utils/logger')
const { sendSentryError } = require('@server/utils/sentry')
const db = require('../models/index')
const { processEntries } = require('./processEntries')
const attainmentsToSisu = require('../utils/sendToSisu')
const { filterDuplicateMatches } = require('../utils/earlierCompletions')

// Summarizes failure messages into a more compact, readable form
const summarizeReasons = (failed) => {
  const counts = failed.reduce((acc, { studentNumber, message }) => {
    const reason = String(message).replace(new RegExp(studentNumber, 'g'), '<student>').replace(/\s+/g, ' ').trim()
    return { ...acc, [reason]: (acc[reason] || 0) + 1 }
  }, {})
  return Object.entries(counts).map(([reason, amount]) => `${amount}x ${reason}`)
}

const automatedAddToDb = async (allMatches, course, batchId, sendToSisu = false) => {
  const matches = filterDuplicateMatches(allMatches)

  if (!matches.length) {
    return { message: 'no new entries' }
  }

  const transaction = await db.sequelize.transaction()

  let entriesToSend
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
      logger.error({ message: `${failed.length} entries failed` })
      for (const failedEntry of failed) {
        logger.error({ message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}` })
        await db.raw_entries.destroy({
          where: {
            id: failedEntry.id
          }
        })
      }

      sendSentryError('Completions dropped from job run', null, {
        course: course.courseCode,
        batchId,
        failedAmount: failed.length,
        totalAmount: newRawEntries.length,
        reasons: summarizeReasons(failed),
        studentNumbers: failed.map(({ studentNumber }) => studentNumber)
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
    await db.raw_entries.destroy({
      where: {
        batchId
      }
    })
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
