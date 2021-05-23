
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const db = require('../models/index')
const logger = require('@utils/logger')
const { processEntries } = require('../scripts/sisProcessEntry')


/**
 * Refresh entries which are missing enrollment and update fields
 * to entry from enrollment. Update batch id for entries where an
 * enrolment is found.
 *
 * @returns amount of entries with a new enrolment and new batch id
 */
const refreshEntries = async (rawEntryIds) => {
  const rawEntries = await db.raw_entries.findAll({
    where: {
      id: { [Op.in]: rawEntryIds }
    },
    include: [
      { model: db.entries, as: 'entry' }
    ]
  })
  const [, success] = await processEntries(rawEntries, true)
  const newEntriesWithEnrollment = success.filter((e) => e.courseUnitId && e.courseUnitRealisationId && e.assessmentItemId)
  const transaction = await db.sequelize.transaction()
  try {
    await db.entries.bulkCreate(success, {
      updateOnDuplicate: ['courseUnitRealisationId', 'courseUnitRealisationName', 'assessmentItemId', 'courseUnitId', 'gradeScaleId', 'gradeId'],
      transaction
    })
    const batchId = `limbo-${new Date().getMilliseconds()}`
    await db.raw_entries.update(
      { batchId },
      {
        where: {
          id: { [Op.in]: newEntriesWithEnrollment.map((e) => e.rawEntryId) }
        },
        transaction
      })
    await transaction.commit()
    return [newEntriesWithEnrollment.length, batchId]
  } catch (e) {
    transaction.rollback()
    logger.error({ message: `Refreshing entries failed ${e.toString()}` })
    throw e
  }
}

module.exports = refreshEntries
