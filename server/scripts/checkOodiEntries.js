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
    const allUnregistered = await db.credits.findAll({
      where: {
        isInOodikone: false,
        completionId: {
          [Op.ne]: null
        }
      }
    })
    logger.info(`Found ${allUnregistered.length} unchecked credits`)

    const unResolvedConfirmations = allUnregistered.map(async (credit) => {
      const hasEntry = await hasOodiEntry(credit.studentId, credit.courseId)
      if (hasEntry) {
        return { completion_id: credit.completionId, student_number: credit.studentId }
      }
    })

    const unFilteredConfirmations = await Promise.all(unResolvedConfirmations)
    const confirmations = unFilteredConfirmations.filter((c) => c)
    logger.info(`Found ${confirmations.length} credit registrations`)

    if (confirmations.length) {
      const result = await postRegistrations(confirmations)
      if (result === 'success') {
        confirmations.forEach(({ completion_id }) => markAsRegistered(completion_id))
      }
      logger.info(`points.mooc.fi response: ${result}`)
    }

  } catch (error) {
    logger.error(`Error in running Oodicheck: ${error.message}`)
  }
}

module.exports = checkOodiEntries
