const hasOodiEntry = require('../services/oodikone')
const { postRegistrations } = require('../services/pointsmooc')
const Sequelize = require('sequelize')
const db = require('../models/index')

const Op = Sequelize.Op
const logger = require('@utils/logger')

const markAsRegistered = (completionId) =>
  db.credits.update(
    { isInOodikone: true },
    { where: { completionId: completionId } }
  )

const checkOodiEntries = async () => {
  try {
    const unregisteredCredits = await db.credits.findAll({
      where: {
        isInOodikone: false,
        completionId: {
          [Op.ne]: null
        }
      }
    })
    logger.info(`Found ${unregisteredCredits.length} unchecked credits`)

    const slicedUnregisteredCredits = (unregisteredCredits && unregisteredCredits.length && unregisteredCredits.length > 400) ? unregisteredCredits.slice(200,399) : []

    if (!slicedUnregisteredCredits.length) {
      logger.info('No new credits were registered')
      return null
    }

    const confirmations = await slicedUnregisteredCredits.reduce(
      async (accPromise, credit) => {
        const acc = await accPromise
        try {
          const hasEntry = await hasOodiEntry(credit.studentId, credit.courseId)
          if (hasEntry) {
            return acc.concat({
              completion_id: credit.completionId,
              student_number: credit.studentId
            })
          }
        } catch (error) {
          logger.error(`Error checking oodi entry: ${error}`)
        }
        return acc
      },
      []
    )

    logger.info(`Found ${confirmations.length} credit registrations`)

    if (confirmations.length) {
      const result = await postRegistrations(confirmations)
      if (result === 'success') {
        confirmations.forEach(({ completion_id }) =>
          markAsRegistered(completion_id)
        )
      }
      logger.info(`points.mooc.fi response: ${result}`)
    }
  } catch (error) {
    logger.error(`Error in running Oodicheck: ${error.message}`)
  }
}

module.exports = checkOodiEntries
