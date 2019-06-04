const hasOodiEntry = require('../services/oodikone')
const { postRegistrations } = require('../services/pointsmooc')
const Sequelize = require('sequelize')
const db = require('../models/index')
const Op = Sequelize.Op

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

    console.log(`${allUnregistered.length} unregistered completions found.`)
    allUnregistered.forEach(async (credit) => {
      // still wip, not all completions that are marked in db are sent forward
      const onko = await hasOodiEntry(credit.studentId, credit.courseId)
      if (onko) {
        console.log('processing student ', credit.studentId)

        const res = await markAsRegistered(credit.completionId)
        console.log('processed', credit.studentId)

        if (res) {
          console.log('calling postReg')

          postRegistrations(credit.completionId)
        }
      }
    })
  } catch (error) {
    console.log('Error in running Oodicheck:', error.message)
  }
}

module.exports = checkOodiEntries
