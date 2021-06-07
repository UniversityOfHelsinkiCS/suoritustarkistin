// const hasOodiEntry = require('../services/oodikone')
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

    const faultyStudentNumbers = ['014226385', '014732571', '014374078', '0154210102']

    const confirmations = await unregisteredCredits.split(0,100).reduce(
      async (accPromise, credit) => {
        const acc = await accPromise
        try {
          const hasEntry = !faultyStudentNumbers.includes(String(credit.studentId))
          if (hasEntry) {
            return acc.concat({
              completion_id: credit.completionId,
              student_number: String(credit.studentId)
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
      if (result === 'OK') {
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
