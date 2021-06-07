const Sequelize = require('sequelize')
const db = require('../models/index')
const logger = require('@utils/logger')
const api = require('../config/importerApi')
const { postRegistrations } = require('../services/pointsmooc')

const checkEntries = async (entries) => {
  const postData = entries.map(({ personId, assessmentItemId, gradeId, courseUnitId, id }) => ({
    id, personId, assessmentItemId, gradeId, courseUnitId
  }))

  try {
    const { data } = await api.post('/suotar/verify', postData)
    const amountUpdated = await markAsRegistered(data)
    logger.info({
      message: `Checked total ${entries.length} entries, found ${amountUpdated} new registrations.`,
      newRegistrations: data.length,
      missingRegistrations: (entries.length - data.length)
    })
    return true
  } catch (e) {
    logger.error({ message: 'Failed to check Sisu entries', error: e.toString() })
    return false
  }
}

const markAsRegistered = async (entries) => {
  const partlyIds = entries.filter(({ registered }) => registered === 'AssessmentItemAttainment').map(({ id }) => id)
  const registeredIds = entries.filter(({ registered }) => registered === 'CourseUnitAttainment').map(({ id }) => id)
  const partlyAffected = await db.entries.update({ registered: 'PARTLY_REGISTERED' }, {
    where: {
      id: { [Sequelize.Op.in]: partlyIds }
    }
  })
  const registeredAffected = await db.entries.update({ registered: 'REGISTERED' }, {
    where: {
      id: { [Sequelize.Op.in]: registeredIds }
    }
  })
  return partlyAffected + registeredAffected
}

const checkAllEntriesFromSisu = async () => {
  const entries = await db.entries.findAll({
    where: {
      registered: { [Sequelize.Op.eq]: 'NOT_REGISTERED' },
      sent: { [Sequelize.Op.not]: null }
    }
  })
  await checkEntries(entries)
}

const markAsRegisteredToMooc = async (completionStudentPairs) => {
  const date = new Date()
  const moocCompletionsIds = completionStudentPairs.map(({ completion_id }) => completion_id)
  return await db.raw_entries.update({ registeredToMooc: date }, {
    where: {
      moocCompletionId: { [Sequelize.Op.in]: moocCompletionsIds }
    }
  })
}

const checkRegisteredForMooc = async () => {
  try {
    const unregistered = await db.raw_entries.findAll({
      where: {
        registeredToMooc: { [Sequelize.Op.eq]: null },
        moocCompletionId: { [Sequelize.Op.not]: null }
      },
      include: [
        { model: db.entries, as: 'entry' }
      ]
    })

    logger.info(`Found ${unregistered.length} unchecked completions`)

    const completionStudentPairs = unregistered.reduce(
      (completionStudentPairs, rawEntry) => {
        const alreadyInSis = rawEntry.entry && rawEntry.entry.registered
        if (alreadyInSis) {
          return completionStudentPairs.concat({
            completion_id: rawEntry.moocCompletionId,
            student_number: String(rawEntry.studentNumber)
          })
        }
        return completionStudentPairs
      },
      []
    )

    logger.info(`Found ${completionStudentPairs.length} new completion registrations in Sis`)

    if (completionStudentPairs.length && process.env.NODE_ENV === 'production') {
      const result = await postRegistrations(completionStudentPairs)
      if (result === 'OK') {
        await markAsRegisteredToMooc(completionStudentPairs)
      }
    }

  } catch (error) {
    logger.error(`Error in running Mooc registration check: ${error.message}`)
  }

}

module.exports = {
  checkAllEntriesFromSisu, checkEntries, checkRegisteredForMooc
}