const Sequelize = require('sequelize')
const db = require('../models/index')
const logger = require('@utils/logger')
const api = require('../config/importerApi')
const { postRegistrations } = require('../services/pointsmooc')

const checkEntries = async (entries) => {
  const data = entries.map(({ personId, courseUnitRealisationId, assessmentItemId, gradeId, courseUnitId, id }) => ({
    id, personId, courseUnitRealisationId, assessmentItemId, gradeId, courseUnitId
  }))

  try {
    const resp = await api.post('/suotar/verify', data)
    const registeredEntries = resp.data.filter(({ registered }) => registered)
    const amountUpdated = await markAsRegistered(registeredEntries)
    logger.info({ 
      message: `Checked total ${entries.length} entries, found ${amountUpdated} new registrations.`,
      sis: true,
      newRegistrations: registeredEntries.length, 
      missingRegistrations: (entries.length - registeredEntries.length) 
    })
    return true
  } catch (e) {
    logger.error({ message: 'Failed to check Sisu entries', error: e.toString(), sis: true })
    return false
  }
}

const markAsRegistered = async (entries) => {
  const ids = entries.map(({ id }) => id)
  return await db.entries.update({ registered: true }, {
    where: { 
      id: { [Sequelize.Op.in]: ids } 
    }
  })
}

const checkAllEntriesFromSisu = async () => {
  const entries = await db.entries.findAll({
    where: {
      registered: { [Sequelize.Op.eq]: null },
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

    if (completionStudentPairs.length) {
      const result = await postRegistrations(completionStudentPairs)
      if (result === 'OK') {
        await markAsRegisteredToMooc(completionStudentPairs)
      }
      logger.info(`points.mooc.fi response: ${result}`)
    }

  } catch (error) {
    logger.error(`Error in running Mooc registration check: ${error.message}`)
  }  
  
}

module.exports = {
  checkAllEntriesFromSisu, checkEntries, checkRegisteredForMooc
}