const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('./sisProcessEntry')

const automatedAddToDb = async (matches, course, batchId) => {
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
      batchId,
      sis: true
    })
    const checkImprovements = false
    const [failed, success] = await processEntries(newRawEntries, checkImprovements, true)
  
    if (failed.length) {
      logger.info({
        message: `${failed.length} entries failed`,
        sis: true
      })
  
      for (const failedEntry of failed) {
        logger.info({
          message: `Completion failed for ${failedEntry.studentNumber}: ${failedEntry.message}`,
          sis: true
        })
        await db.raw_entries.destroy({
          where: {
            id: failedEntry.id
          }
        })
      }
    }
  
    if (success && success.length) {
      await db.entries.bulkCreate(success, { transaction })
      logger.info({
        message: `${success.length} new entries created`,
        amount: success.length,
        sis: true
      })
      transaction.commit()
      return { message: "success" }
    }

    await transaction.rollback()
    logger.info('Job run ended successfully, no new entries created')
    return { message: "no new entries" }
  } catch (error) {
    await transaction.rollback()
    await db.raw_entries.destroy({
      where: {
        batchId: batchId
      }
    })
    logger.error(`Error processing new completions: ${error.message}`)
    return { message: `Error processing new completions: ${error.message}` }
  }
}

module.exports = { automatedAddToDb }