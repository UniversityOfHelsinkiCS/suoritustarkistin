const Sequelize = require('sequelize')
const axios = require('axios')

const db = require('../models/index')
const logger = require('@utils/logger')
const { checkEntries } = require('../scripts/checkSisEntries')
const { getEmployees, getAcceptorPersons } = require('../services/importer')
const refreshEntries = require('../scripts/refreshEntries')
const { sendSentryMessage } = require('@utils/sentry')

const Op = Sequelize.Op
const PAGE_SIZE = 10 // Batches, no single reports

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

const RAW_ENTRY_INCLUDES = [
  { model: db.entries, as: 'entry', include: ['sender'] },
  { model: db.users, as: 'reporter' },
  { model: db.users, as: 'grader' },
  { model: db.courses, as: 'course' }
]

const getMoocFilter = (isMooc) => {
  return {
    reporterId: {
      [isMooc
        ? Op.eq
        : Op.not
      ]: null
    }
  }
}

/**
 * Get full batches of reports using pagination.
 */
const getBaches = async ({ offset, moocReports = false, userId }) => {
  const filters = {}
  if (userId)
    filters.reporterId = userId
  else
    filters.reporterId = {
      [moocReports
        ? Op.eq
        : Op.not
      ]: null
    }

  // Get paginated distinct batch ids using limit and offset
  const batches = await db.raw_entries.findAndCountAll({
    where: {
      ...filters
    },
    attributes: [[Sequelize.literal('DISTINCT "batchId"'), 'batchId'], 'createdAt'],
    groupBy: ['batchId'],
    order: [['createdAt', 'DESC']],
    raw: true,
    limit: PAGE_SIZE,
    offset
  })

  // Get total count of batch ids as db.raw_entries.findAndCountAll
  // returns count for raw entries and we need count for distinct batch ids
  const count = await db.raw_entries.getBatchCount(filters)

  const batchIds = batches.rows.map(({ batchId }) => batchId)
  const rows = await db.raw_entries.findAll({
    where: {
      batchId: {
        [Op.in]: batchIds
      }
    },
    include: [...RAW_ENTRY_INCLUDES],
    order: [['createdAt', 'DESC']]
  })
  return { rows, count: Number(count[0].count) }
}

const getAllSisReports = async (req, res) => {
  try {
    const { offset } = req
    const userId = !req.user.isAdmin ? req.user.id : null
    const { rows, count } = await getBaches({ offset, userId })
    return res.status(200).send({ rows, offset, count, limit: PAGE_SIZE })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getAllSisMoocReports = async (req, res) => {
  try {
    const { offset } = req
    const { rows, count } = await getBaches({ offset, moocReports: true })
    return res.status(200).send({ rows, offset, count, limit: PAGE_SIZE })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getAllEnrollmentLimboEntries = async (req, res) => {
  try {
    const { offset } = req
    const { rows, count } = await db.raw_entries.findAndCountAll({
      where: {
        [Op.or]: [
          { '$entry.courseUnitId$': null },
          { '$entry.courseUnitRealisationId$': null },
          { '$entry.assessmentItemId$': null }
        ]
      },
      include: [...RAW_ENTRY_INCLUDES],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
      limit: PAGE_SIZE,
      offset
    })
    return res.status(200).send({ rows, offset, count, limit: PAGE_SIZE })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

/**
 * Get offset for given batch id.
 */
const getOffset = async (req, res) => {
  const { batchId } = req.params
  const rawEntry = await db.raw_entries.findOne({
    where: { batchId },
    raw: true
  })
  if (!rawEntry) return res.status(404).send('Report not found!')
  const isMooc = !rawEntry.reporterId

  const filters = { ...getMoocFilter(isMooc) }
  if (!req.user.isAdmin)
    filters.reporterId = req.user.id

  const batches = await db.raw_entries.findAll({
    where: {
      ...filters
    },
    attributes: [[Sequelize.literal('DISTINCT "batchId"'), 'batchId'], 'createdAt', 'reporterId'],
    groupBy: ['batchId'],
    order: [['createdAt', 'DESC']],
    raw: true
  })

  const index = batches.findIndex((batch) => batch.batchId === batchId)
  if (index < 0) return res.status(404).send('Report not found!')
  // Get offset for given batch id. Offset needs to be floored to nearest page size
  // as we want offset to be divisible with page size
  const offset = Math.floor(Math.max(index - 1, 0) / PAGE_SIZE) * PAGE_SIZE
  res.send({ offset, mooc: !batches[offset].reporterId })
}

const deleteSingleSisEntry = async (req, res) => {
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

const deleteSisBatch = async (req, res) => {
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
    const entriesWithMissingEnrollment = await db.entries.getMissingEnrollments()
    const [amount, batchId] = await refreshEntries(entriesWithMissingEnrollment.map(({ rawEntryId }) => rawEntryId))
    logger.info({ message: `${amount} entries refreshed successfully.` })
    return res.status(200).json({ amount, batchId })
  } catch (e) {
    logger.error({ message: `Refreshing entries failed ${e.toString()}` })
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


  const data = entriesToRequestData(entries, verifier, acceptors)
  let status = 200
  try {
    logger.info({ message: 'Sending entries to Sisu', amount: data.length, user: req.user.name, payload: JSON.stringify(data) })
    await api.post('suotar/', data)
    await updateSuccess(entryIds, senderId)
    logger.info({ message: 'All entries sent successfully to Sisu', successAmount: data.length })
    sendSentryMessage(`${data.length} entries sent successfully to Sisu!`, req.user)
  } catch (e) {
    status = 400
    const payload = JSON.stringify(data)
    const errorMessage = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
    logger.error({ message: 'Error when sending entries to Sisu', errorMessage, payload })
    sendSentryMessage('Sending entries to Sisu failed', req.user, { errorMessage, payload: data })

    if (!isValidSisuError(e.response)) {
      logger.error({ message: 'Sending entries to Sisu failed, got an error not from Sisu', user: req.user.name })
      return res.status(400).send({ message: e.response ? e.response.data : '', genericError: true, user: req.user.name })
    }
    const failedEntries = await writeErrorsToEntries(e.response, senderId)
    logger.error({ message: 'Some entries failed in Sisu', failedAmount: failedEntries.length, user: req.user.name })

    // Entries without an error, is not sent successfully to Sisu so we need to send those a second time
    const successEntries = entries
      .filter(({ id }) => !failedEntries.includes(id))
    if (successEntries.length) {
      try {
        const payload = entriesToRequestData(successEntries, verifier, acceptors)
        logger.info({ message: 'Sending entries to Sisu round two', payload: JSON.stringify(payload) })
        await api.post('suotar/', payload)
        await updateSuccess(successEntries.map(({ id }) => id), senderId)
        logger.info({ message: 'All entries sent successfully to Sisu round two', successAmount: data.length })
        sendSentryMessage(`${data.length} entries sent successfully to Sisu! (Round 2)`, req.user)
      } catch (e) {
        const err = e.response ? JSON.stringify(e.response.data || null) : JSON.stringify(e)
        logger.error({ message: 'Error when sending entries to Sisu round two', errorMessage: err, payload })
        sendSentryMessage(`Sending entries to Sisu failed! (Round 2)`, req.user, { payload, errorMessage: err })
      }
    }
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
  return failingIds.filter((id) => id !== "non-identifiable")
}

const writeErrorsToEntries = async ({ data }, senderId) => {
  const failingIds = parseSisuErrors(data) || data
  await Promise.all(failingIds.map((id) => {
    db.entries.update({
      errors: { ...data.violations[id] },
      sent: new Date(),
      senderId
    }, {
      where: { id }
    })

  }))
  return failingIds
}

const entriesToRequestData = (entries, verifier, acceptors) => entries.map((entry) => {
  const {
    id,
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
    id,
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
    state: gradeId === '0' ? 'FAILED' : 'ATTAINED', // naive, 0 equals to failing grade
    credits: parseFloat(rawEntry.credits)
  }
})

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
  getAllSisReports,
  deleteSingleSisEntry,
  deleteSisBatch,
  sendToSis,
  refreshSisStatus,
  refreshEnrollments,
  getAllSisMoocReports,
  getAllEnrollmentLimboEntries,
  getOffset
}