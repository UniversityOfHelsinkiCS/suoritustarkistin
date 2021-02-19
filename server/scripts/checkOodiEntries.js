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

    const allConfirmations = await unregisteredCredits.reduce(
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

    const confirmations = (allConfirmations && allConfirmations.length > 5) ? allConfirmations.slice(0,5) : allConfirmations
    logger.info(`Found ${confirmations.length} credit registrations`)

    if (confirmations.length) {
      logger.info(`Registered ids and student numbers: `)
      for (const c of confirmations) {
        logger.info(c)
      }
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
