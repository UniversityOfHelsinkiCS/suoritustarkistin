const Sequelize = require('sequelize')
const logger = require('@utils/logger')
const db = require('../models/index')
const api = require('../config/importerApi')
const { postRegistrations } = require('../services/pointsmooc')
const { postRegistrations: postNewMoocRegistrations } = require('../services/newMooc')

const markAsRegistered = async (entries, model) => {
  const partlyIds = entries.filter(({ registered }) => registered === 'AssessmentItemAttainment').map(({ id }) => id)
  const registeredIds = entries.filter(({ registered }) => registered === 'CourseUnitAttainment').map(({ id }) => id)
  let partlyAffected = 0
  let registeredAffected = 0
  if (partlyIds.length) {
    const result = await db[model].update(
      { registered: 'PARTLY_REGISTERED' },
      {
        where: {
          id: { [Sequelize.Op.in]: partlyIds },
          registered: { [Sequelize.Op.not]: 'PARTLY_REGISTERED' }
        }
      }
    )
    partlyAffected = result[0]
  }
  if (registeredIds.length) {
    const result = await db[model].update(
      { registered: 'REGISTERED' },
      {
        where: {
          id: { [Sequelize.Op.in]: registeredIds },
          registered: { [Sequelize.Op.not]: 'REGISTERED' }
        }
      }
    )
    registeredAffected = result[0]
  }
  return partlyAffected + registeredAffected
}

const checkEntries = async (entries, model) => {
  const postData = entries.map(({ personId, id }) => ({ id, personId }))

  try {
    const { data } = await api.post('/suotar/verify', postData)
    if (!data.length) return true
    const amountUpdated = await markAsRegistered(data, model)
    logger.info({
      message: `Checked total ${entries.length} ${model}, found ${amountUpdated} new registrations.`,
      newRegistrations: data.length,
      missingRegistrations: entries.length - data.length
    })
    return true
  } catch (e) {
    logger.error({ message: 'Failed to check Sisu entries 2', error: e.toString() })
    return false
  }
}

const checkAllEntriesFromSisu = async () => {
  const entries = await db.entries.findAll({
    where: {
      registered: { [Sequelize.Op.not]: 'REGISTERED' },
      errors: { [Sequelize.Op.eq]: null },
      sent: { [Sequelize.Op.not]: null }
    }
  })
  const extraEntries = await db.extra_entries.findAll({
    where: {
      registered: { [Sequelize.Op.not]: 'REGISTERED' },
      errors: { [Sequelize.Op.eq]: null },
      sent: { [Sequelize.Op.not]: null }
    }
  })
  await checkEntries(entries, 'entries')
  await checkEntries(extraEntries, 'extra_entries')
}

const markAsRegisteredToMooc = async (completionStudentPairs) => {
  const date = new Date()
  // eslint-disable-next-line camelcase
  const moocCompletionsIds = completionStudentPairs.map(({ completion_id }) => completion_id)
  return await db.raw_entries.update(
    { registeredToMooc: date },
    {
      where: {
        [Sequelize.Op.or]: [
          { moocCompletionId: { [Sequelize.Op.in]: moocCompletionsIds } },
          { newMoocCompletionId: { [Sequelize.Op.in]: moocCompletionsIds } }
        ]
      }
    }
  )
}

function chunkArray(array) {
  const SIZE = 100
  const result = []
  for (let i = 0; i < array.length; i += SIZE) {
    result.push(array.slice(i, i + SIZE))
  }
  return result
}

const registerChunks = async (chunks, poster) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const chunk of chunks) {
    const result = await poster(chunk)
    if (result === 'OK') {
      await markAsRegisteredToMooc(chunk)
    } else {
      // fallback to single students
      // eslint-disable-next-line no-restricted-syntax
        for (const entry of chunk) {
        const result = await poster([entry])
        if (result === 'OK') {
          await markAsRegisteredToMooc([entry])
        }
      }
    }
  }
}

const checkRegisteredForMooc = async () => {
  try {
    const unregistered = await db.raw_entries.findAll({
      where: {
        registeredToMooc: { [Sequelize.Op.eq]: null },
        moocCompletionId: { [Sequelize.Op.not]: null }
      },
      include: [{ model: db.entries, as: 'entry' }]
    })

    logger.info(`Found ${unregistered.length} unchecked completions`)

    const completionStudentPairs = unregistered.reduce((completionStudentPairs, rawEntry) => {
      const alreadyInSis =
        rawEntry.entry &&
        (rawEntry.entry.registered === 'PARTLY_REGISTERED' || rawEntry.entry.registered === 'REGISTERED')
      if (alreadyInSis) {
        return completionStudentPairs.concat({
          completion_id: rawEntry.moocCompletionId,
          student_number: String(rawEntry.studentNumber),
          registration_date: rawEntry.attainmentDate
        })
      }
      return completionStudentPairs
    }, [])

    logger.info(`Found ${completionStudentPairs.length} new completion registrations in Sis`)

    if (completionStudentPairs.length && process.env.NODE_ENV === 'production') {
      const chunks = chunkArray(completionStudentPairs)
      await registerChunks(chunks, postRegistrations)
    }
  } catch (error) {
    logger.error(`Error in running Mooc registration check: ${error.message}`)
  }
}

const checkRegisteredForNewMooc = async () => {
  try {
    const unregistered = await db.raw_entries.findAll({
      where: {
        registeredToMooc: { [Sequelize.Op.eq]: null },
        newMoocCompletionId: { [Sequelize.Op.not]: null }
      },
      include: [{ model: db.entries, as: 'entry' }]
    })

    logger.info(`Found ${unregistered.length} unchecked completions for new Mooc`)

    const completionStudentPairs = unregistered.reduce((completionStudentPairs, rawEntry) => {
      const alreadyInSis =
        rawEntry.entry &&
        (rawEntry.entry.registered === 'PARTLY_REGISTERED' || rawEntry.entry.registered === 'REGISTERED')
      if (alreadyInSis) {
        return completionStudentPairs.concat({
          completion_id: rawEntry.newMoocCompletionId,
          student_number: String(rawEntry.studentNumber),
          registration_date: rawEntry.attainmentDate
        })
      }
      return completionStudentPairs
    }, [])

    logger.info(`Found ${completionStudentPairs.length} new completion registrations in Sis`)

    if (completionStudentPairs.length) {
      const chunks = chunkArray(completionStudentPairs)
      await registerChunks(chunks, postNewMoocRegistrations)
    }
  } catch (error) {
    logger.error(`Error in running new Mooc registration check: ${error.message}`)
  }
}

module.exports = {
  checkAllEntriesFromSisu,
  checkEntries,
  checkRegisteredForMooc,
  checkRegisteredForNewMooc
}
