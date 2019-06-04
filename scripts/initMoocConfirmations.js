const { postRegistrations } = require('../services/pointsmooc')
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const fs = require('fs')
const sendMail = require('../utils/sendEmail')

const initialiseMoocConfirmations = async () => {
  const data = formatListForMoocUpdate(await gatherConfirmedCompletions())
  const postedRegistrations = await postRegistrations(data)
  console.log(postedRegistrations)
  const path = await saveToDisk(data)
}

const gatherConfirmedCompletions = async () =>
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

const saveToDisk = async (completionAndStudentIdList) => {
  let data = completionAndStudentIdList.reduce(
    (acc, item) => `${acc.concat(JSON.stringify(item))},\n`,
    '[ '
  )
  data = data.concat(' ]')
  try {
    fs.writeFile(
      './reports/uploadedConfirmationsToPointsMooc.lst',
      data,
      (error) => {
        if (error) console.log(`Error writing to file:\n${error}`)
      }
    )
    return [{ path: './reports/uploadedConfirmationsToPointsMooc.lst' }]
  } catch (e) {
    console.log(
      `Error in updating confirmed registrations. Error message:\n${e}`
    )
  }
}

module.exports = {
  initialiseMoocConfirmations
}
