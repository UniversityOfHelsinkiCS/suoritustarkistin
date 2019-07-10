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

    allUnregistered.forEach(async (credit) => {
      // still wip, not all completions that are marked in db are sent forward
      const hasEntry = await hasOodiEntry(credit.studentId, credit.courseId)
      if (hasEntry) {
        const res = await markAsRegistered(credit.completionId)
        if (res) {
          postRegistrations(credit.completionId)
        }
      }
    })
  } catch (error) {
    logger.error('Error in running Oodicheck:', error.message)
  }
}

module.exports = checkOodiEntries
