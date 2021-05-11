const logger = require('@utils/logger')
const db = require('../models/index')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const axios = require('axios')
const { checkEntries } = require('../scripts/checkSisEntries')
const { getEmployees, getAcceptorPersons } = require('../services/importer')
const refreshEntries = require('../scripts/sisRefreshEntry')

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
        { model: db.users, as: 'reporter' },
        { model: db.courses, as: 'course' }
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

const refreshEnrollments = async (req, res) => {
  if (!req.user.isGrader && !req.user.isAdmin)
    throw new Error('User is not authorized to report credits.')

  try {
    const [amount, batchId] = await refreshEntries(req.body)
    logger.info({ message: `${amount} entries refreshed successfully.`, sis: true })
    return res.status(200).json({ amount, batchId })
  } catch (e) {
    logger.error({ message: `Refreshing entries failed ${e.toString()}`, sis: true })
    return res.status(400).json({ message: `Refreshing entries failed ${e.toString()}` })
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

  const verifier = await getEmployees([req.user.employeeId])
  if (!verifier.length)
    throw new Error(`Verifier with employee number ${req.user.employeeId} not found`)


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

  const acceptors = await getAcceptorPersons(entries.map(({ courseUnitRealisationId }) => courseUnitRealisationId))

  const data = entries.map((entry) => {
    const {
      personId,
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
      verifierPersonId: verifier[0].id,
      acceptorPersons: acceptors[courseUnitRealisationId],
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
    logger.info({ message: 'Sending entries to Sisu', amount: data.length, sis: true, user: req.user.name, payload: JSON.stringify(data) })
    await api.post('suotar/', data)
    await updateSuccess(entryIds, senderId)
    logger.info({ message: 'All entries sent successfully to Sisu', successAmount: data.length, sis: true })
  } catch (e) {
    status = 400
    const payload = JSON.stringify(data)
    const errorMessage = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
    logger.error({ message: 'Error when sending entries to Sisu', sis: true, errorMessage, payload })
    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: req.user.name, sis: true })
      return res.status(400).send({ message: e.response ? e.response.data : '', genericError: true, sis: true, user: req.user.name })
    }
    const failedEntries = await writeErrorsToEntries(e.response, data, entries, senderId)

    // Entries without an error, is probably(?) sent successfully to Sisu
    const successEntryIds = entries
      .filter(({ id }) => !failedEntries.includes(id))
      .map((entry) => entry.id)
    await updateSuccess(successEntryIds, senderId)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, successAmount: successEntryIds.length, user: req.user.name, sis: true })
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
  const identifiableViolations = failingIds.filter((id) => id !== "non-identifiable")
  const errors = Array(identifiableViolations.length).fill(undefined)
  identifiableViolations
    .forEach((id) => {
      // path is like importActiveAttainments.attainments[1].personId
      // where we want to obtain the index (attainments[index]) so we can
      // specify which entry the violation is related to
      const index = violations[id][0].path.split(".")[1].substr(-2, 1)
      errors[index] = violations[id].map((violation) => JSON.stringify(violation))
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
  refreshSisStatus,
  refreshEnrollments
}