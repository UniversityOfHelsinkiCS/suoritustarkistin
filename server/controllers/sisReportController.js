const logger = require('@utils/logger')
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const axios = require('axios')
const { checkEntries } = require('../scripts/checkSisEntries')


// Create an api instance if a different url for posting entries to Sisu is defined,
// otherwise use common api instance.
const api = process.env.POST_IMPORTER_DB_API_URL
  ? axios.create({
    headers: {
      token: process.env.IMPORTER_DB_API_TOKEN || ''
    },
    baseURL: process.env.POST_IMPORTER_DB_API_URL
  })
  : require('../config/importerApi')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const sisGetAllReports = async (req, res) => {
  try {
    const allRawEntries = await db.raw_entries.findAll({
      include: [
        { model: db.entries, as: 'entry', include: ['sender'] },
        { model: db.users, as: 'reporter' }
      ],
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(allRawEntries)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisGetUsersReports = async (req, res) => {
  try {
    const usersRawEntries = await db.raw_entries.findAll({
      where: { graderId: req.user.id },
      include: [
        { model: db.entries, as: 'entry', include: ['sender'] },
        { model: db.users, as: 'reporter' }
      ],
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).send(usersRawEntries)
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisDeleteSingleEntry = async (req, res) => {
  try {
    db.raw_entries.destroy({
      where: {
        id: req.params.id
      }
    })
    return res.status(200).json({ id: req.params.id })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const sisDeleteBatch = async (req, res) => {
  try {
    db.raw_entries.destroy({
      where: {
        batchId: req.params.batchId
      }
    })
    return res.status(200).json({ batchId: req.params.batchId })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

/**
 * Send entries to Sisu using importer-db-api.
 * Request body should contain a list of entry ids to be sent to Sisu.
 */
const sendToSis = async (req, res) => {
  if (!req.user.isGrader && !req.user.isAdmin) {
    throw new Error('User is not authorized to report credits.')
  }

  const entryIds = req.body
  const entries = await db.entries.findAll({
    where: {
      id: { [Op.in]: entryIds }
    },
    include: ['rawEntry'],
    raw: true,
    nest: true
  })
  const senderId = req.user.id

  const data = entries.map((entry) => {
    const {
      personId,
      verifierPersonId,
      courseUnitRealisationId,
      assessmentItemId,
      completionDate,
      completionLanguage,
      courseUnitId,
      gradeScaleId,
      gradeId,
      rawEntry
    } = entry

    return {
      personId,
      verifierPersonId,
      courseUnitRealisationId,
      assessmentItemId,
      completionDate,
      completionLanguage,
      courseUnitId,
      gradeScaleId,
      gradeId,
      credits: parseFloat(rawEntry.credits)
    }
  })

  let status = 200
  try {
    logger.info({ message: 'Sending entries to Sisu', amount: data.length, sis: true, user: req.user.name })
    await api.post('suotar/', data)
    await updateSuccess(entryIds, senderId)
  } catch (e) {
    status = 400
    logger.error({ message: 'Error when sending entries to Sisu', sis: true, error: e.toString() })
    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: req.user.name, error: e.toString(), sis: true })
      return res.status(400).send({ message: e.response ? e.response.data : '', genericError: true, sis: true, user: req.user.name })
    }
    const failedEntries = await writeErrorsToEntries(e.response, data, entries, senderId)

    // Entries without an error, is probably(?) sent successfully to Sisu
    const successEntryIds = entries.filter(({ id }) => !failedEntries.includes(id))
    await updateSuccess(successEntryIds, senderId)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, successAmount: successEntryIds.length, user: req.user.name, error: e.response.data, sis: true })
  }

  const updatedWithRawEntries = await db.raw_entries.findAll({
    where: {
      '$entry.id$': { [Op.in]: entryIds }
    },
    include: [
      { model: db.entries, as: 'entry', include: ['sender'] },
      { model: db.users, as: 'reporter' }
    ]
  })

  return res.status(status).json(updatedWithRawEntries)
}

const refreshSisStatus = async (req, res) => {
  if (!req.user.isGrader && !req.user.isAdmin) {
    throw new Error('User is not authorized')
  }

  const entryIds = req.body
  const entries = await db.entries.findAll({
    where: {
      id: { [Sequelize.Op.in]: entryIds }
    }
  })
  const success = await checkEntries(entries)
  if (!success)
    return res.status(400).send('Failed to refresh entries from Sisu')
  const updatedWithRawEntries = await db.raw_entries.findAll({
    where: {
      '$entry.id$': { [Op.in]: entryIds }
    },
    include: [
      { model: db.entries, as: 'entry', include: ['sender'] },
      { model: db.users, as: 'reporter' }
    ]
  })
  return res.json(updatedWithRawEntries)
}

// If the error is coming from Sisu
// it contains keys failingIds and violations
const isValidSisuError = (response) => {
  if (!response) return false
  const { failingIds, violations } = response.data
  return !!failingIds && !!violations
}

const parseSisuErrors = ({ failingIds, violations }) => {
  if (!failingIds || !violations) return null
  const errors = Array(failingIds.length).fill(undefined)
  failingIds
    .filter((id) => id !== "non-identifiable")
    .forEach((id) => {
      // path is like importActiveAttainments.attainments[1].personId
      // where we want to obtain the index (attainments[index]) so we can
      // specify which entry the violation is related to
      const index = violations[id][0].path.split(".")[1].substr(-2, 1)
      errors[index] = violations[id].map((violation) => violation.message)
    })
  return errors
}

const writeErrorsToEntries = async (response, sentEntries, entries, senderId) => {
  const errors = parseSisuErrors(response.data) || response.data
  const failedEntries = []
  for (const index in errors) {
    const { personId, courseUnitRealisationId } = sentEntries[index]
    const entry = entries.find((e) => e.personId === personId && e.courseUnitRealisationId === courseUnitRealisationId)
    failedEntries.push(entry.id)
    await db.entries.update({
      errors: { message: errors[index] ? errors[index].join(", ") : '' },
      sent: new Date(),
      senderId
    }, {
      where: {
        id: entry.id
      }
    })
  }
  return failedEntries
}

const updateSuccess = async (entryIds, senderId) =>
  await db.entries.update({
    sent: new Date(),
    senderId,
    errors: null
  }, {
    where: {
      id: { [Op.in]: entryIds }
    }
  })


module.exports = {
  sisGetAllReports,
  sisGetUsersReports,
  sisDeleteSingleEntry,
  sisDeleteBatch,
  sendToSis,
  refreshSisStatus
}