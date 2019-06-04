const { postRegistrations } = require('../services/pointsmooc')
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const initialiseMoocConfirmations = async () =>
  postRegistrations(formatListForMoocUpdate(await gatherConfirmedCompletions()))

const gatherConfirmedCompletions = () =>
  db.credits.findAll({
    where: {
      isInOodikone: true,
      completionId: {
        [Op.ne]: null
      }
    },
    raw: true
  })

const formatListForMoocUpdate = (CompletedAndConfirmedList) =>
  CompletedAndConfirmedList.map((entry) => ({
    student_number: entry.studentId,
    completion_id: entry.completionId
  }))

module.exports = {
  initialiseMoocConfirmations
}
