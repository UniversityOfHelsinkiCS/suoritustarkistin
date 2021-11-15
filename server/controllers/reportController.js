const Sequelize = require('sequelize')

const db = require('../models/index')
const logger = require('@utils/logger')
const { checkEntries } = require('../scripts/checkSisEntries')
const { getEmployees } = require('../services/importer')
const refreshEntries = require('../scripts/refreshEntries')
const attainmentsToSisu = require('../utils/sendToSisu')

const Op = Sequelize.Op
const PAGE_SIZE = 25 // Batches, no single reports

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: 'Server went BOOM!' })
}

const RAW_ENTRY_INCLUDES = [
  { model: db.entries, as: 'entry', include: ['sender'] },
  { model: db.extra_entries, as: 'extraEntry', include: ['sender'] },
  { model: db.users, as: 'reporter' },
  { model: db.users, as: 'grader' },
  { model: db.courses, as: 'course' }
]

const MISSING_ENROLLMENT_QUERY = [
  { '$entry.courseUnitId$': null },
  { '$entry.courseUnitRealisationId$': null },
  { '$entry.assessmentItemId$': null }
]

const getFilters = ({ isMooc, status, student, errors, noEnrollment, userId, notSent }) => {
  const query = {
    reporterId: {
      [isMooc
        ? Op.eq
        : Op.not
      ]: null
    }
  }

  if (userId)
    query.graderId = userId
  if (student)
    query.studentNumber = { [Op.startsWith]: student }
  if (status)
    query['$entry.registered$'] = status
  if (errors)
    query['$entry.errors$'] = { [Op.not]: null }
  if (noEnrollment) {
    query[Op.or] = MISSING_ENROLLMENT_QUERY
    query['$entry.sent$'] = { [Op.not]: null }
  }
  if (notSent)
    query['$entry.sent$'] = { [Op.eq]: null }

  return query
}

/**
 * Get full batches of reports using pagination.
 */
const getBaches = async ({ offset, moocReports = false, filters }) => {
  const query = {
    ...getFilters({ ...filters, isMooc: moocReports })
  }

  // Get paginated distinct batch ids using limit and offset
  const batches = await db.raw_entries.findAll({
    where: {
      ...query
    },
    attributes: [
      [Sequelize.literal('DISTINCT "batchId"'), 'batchId'],
      [Sequelize.fn('max', Sequelize.col('"raw_entries.createdAt"')), 'maxCreatedAt']
    ],
    group: ['batchId'],
    order: [[Sequelize.col('maxCreatedAt'), 'DESC']],
    include: [
      { model: db.entries, as: 'entry', attributes: [] }
    ],
    raw: true,
    limit: PAGE_SIZE,
    offset
  })

  // Get total count of batch ids as db.raw_entries.findAndCountAll
  // returns count for raw entries and we need count for distinct batch ids
  const count = await db.raw_entries.getBatchCount(query)

  const batchIds = batches.map(({ batchId }) => batchId)
  const rows = await db.raw_entries.findAll({
    where: {
      batchId: {
        [Op.in]: batchIds
      }
    },
    include: [...RAW_ENTRY_INCLUDES],
    order: [['createdAt', 'DESC'], 'studentNumber'],
    raw: true,
    nest: true
  })
  const transformedRows = rows.map((row) => {
    const { extraEntry, entry, ...rest } = row
    if (extraEntry.id) {
      return { ...rest, entry: { ...extraEntry, type: 'EXTRA_ENTRY' } }
    }
    return {
      ...rest,
      entry: {
        ...entry,
        // Sequelize somehow does not include virtual fields
        missingEnrolment: !(entry.courseUnitId && entry.courseUnitRealisationId && entry.assessmentItemId),
        type: 'ENTRY'
      }
    }
  })
  return { rows: transformedRows, count: Number(count[0].count) }
}

const getAllSisReports = async (req, res) => {
  try {
    const { offset, filters } = req
    const { rows, count } = await getBaches({ offset, filters })
    return res.status(200).send({ rows, offset, count, limit: PAGE_SIZE })
  } catch (error) {
    handleDatabaseError(res, error)
  }
}

const getAllSisMoocReports = async (req, res) => {
  try {
    const { offset, filters } = req
    const { rows, count } = await getBaches({ offset, filters, moocReports: true })
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
        [Op.or]: MISSING_ENROLLMENT_QUERY
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

  const filters = { ...getFilters({ isMooc }) }
  if (!req.user.isAdmin)
    filters.graderId = req.user.id

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


  const { entryIds = [], extraEntryIds = [] } = req.body
  let [status, message] = []
  try {
    if (entryIds.length) {
      [status, message] = await attainmentsToSisu('entries', verifier, req)
      if (message)
        return res.status(status).send(message)
    }
    if (extraEntryIds.length) {
      [status, message] = await attainmentsToSisu('extra_entries', verifier, req)
      if (message)
        return res.status(status).send(message)
    }
  } catch (e) {
    logger.error({ message: e.toString(), error: e })
  }
  const updatedWithRawEntries = await db.raw_entries.findAll({
    where: {
      '$entry.id$': { [Op.in]: entryIds.concat(extraEntryIds || []) }
    },
    include: [...RAW_ENTRY_INCLUDES],
    order: [['createdAt', 'DESC'], 'studentNumber']
  })

  return res.status(200).json(updatedWithRawEntries)
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