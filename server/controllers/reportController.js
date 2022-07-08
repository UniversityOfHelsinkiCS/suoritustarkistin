const Sequelize = require('sequelize')

const logger = require('@utils/logger')
const db = require('../models/index')
const { checkEntries } = require('../scripts/checkSisEntries')
const refreshEntries = require('../scripts/refreshEntries')
const attainmentsToSisu = require('../utils/sendToSisu')
const { failedInSisuReport, missingEnrolmentReport } = require('../utils/emailFactory')
const sendEmail = require('../utils/sendEmail')

const { Op } = Sequelize
const PAGE_SIZE = 15 // Batches, no single reports

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

const NOT_SENT_QUERY = [{ '$entry.sent$': null }, { '$extraEntry.sent$': null }]

const transformRows = (row) => {
  const { extraEntry, entry, ...rest } = row
  if (extraEntry.id) {
    return { ...rest, entry: { ...extraEntry, type: 'EXTRA_ENTRY' } }
  }
  return {
    ...rest,
    entry: {
      ...entry,
      // Sequelize somehow does not include virtual fields when using raw: true
      missingEnrolment: !(entry.courseUnitId && entry.courseUnitRealisationId && entry.assessmentItemId),
      type: 'ENTRY'
    }
  }
}

const getFilters = ({ isMooc, status, student, courseId, errors, noEnrollment, graderId, reporterId, notSent }) => {
  const query = {}

  if (reporterId) {
    query.reporterId = reporterId
  } else {
    query.reporterId = {
      [isMooc ? Op.eq : Op.not]: null
    }
  }

  if (graderId) query.graderId = graderId
  if (student) query.studentNumber = { [Op.startsWith]: student }
  if (courseId) query.courseId = courseId
  if (notSent) query[Op.and] = NOT_SENT_QUERY
  if (status) query['$entry.registered$'] = status
  if (errors) query['$entry.errors$'] = { [Op.not]: null }
  if (noEnrollment) {
    query[Op.and] = [{ [Op.or]: MISSING_ENROLLMENT_QUERY }, { '$extraEntry.id$': { [Op.eq]: null } }]
  }

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
      { model: db.entries, as: 'entry', attributes: [] },
      { model: db.extra_entries, as: 'extraEntry', attributes: [] }
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
  return { rows: rows.map(transformRows), count: Number(count[0].count) }
}

const getUnsentEntries = async () => {
  const entries = await db.entries.findAll({
    where: {
      courseUnitId: { [Op.not]: null },
      courseUnitRealisationId: { [Op.not]: null },
      assessmentItemId: { [Op.not]: null },
      sent: null
    },
    include: [
      {
        model: db.raw_entries,
        as: 'rawEntry',
        include: [
          {
            model: db.courses,
            as: 'course'
          }
        ]
      }
    ],
    nest: true,
    raw: true
  })

  const extraEntries = await db.extra_entries.findAll({
    where: {
      sent: null
    },
    include: [
      {
        model: db.raw_entries,
        as: 'rawEntry',
        include: [
          {
            model: db.courses,
            as: 'course'
          }
        ]
      }
    ],
    nest: true,
    raw: true
  })

  return entries.concat(extraEntries)
}

const getUnsentBatchCount = async (req, res) => {
  const entries = await getUnsentEntries()

  const rawEntryIds = entries.map(({ rawEntry }) => rawEntry.id)

  const [{ count }] = await db.raw_entries.getBatchCount({ id: { [Op.in]: rawEntryIds } })

  return res.send({ count })
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
    const query = {
      [Op.or]: MISSING_ENROLLMENT_QUERY
    }
    const { rows } = await db.raw_entries.findAndCountAll({
      where: query,
      include: [...RAW_ENTRY_INCLUDES],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true,
      limit: PAGE_SIZE,
      offset
    })
    const count = await db.raw_entries.getBatchCount(query)

    const transformedRows = rows.map(transformRows).filter(({ entry }) => entry.type === 'ENTRY')
    return res.status(200).send({ rows: transformedRows, offset, count: Number(count[0].count), limit: PAGE_SIZE })
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
  if (!req.user.isAdmin) filters.graderId = req.user.id

  const batches = await db.raw_entries.findAll({
    where: {
      ...filters
    },
    attributes: [[Sequelize.literal('DISTINCT "batchId"'), 'batchId'], 'createdAt', 'reporterId'],
    groupBy: ['batchId'],
    order: [['createdAt', 'DESC']],
    raw: true
  })

  const batchIds = batches.map(({ batchId }) => batchId)
  const uniqueBatchIds = [...new Set(batchIds)]

  const index = uniqueBatchIds.findIndex((batch) => batch === batchId)
  if (index < 0) return res.status(404).send('Report not found!')
  // Get offset for given batch id. Offset needs to be floored to nearest page size
  // as we want offset to be divisible with page size
  const offset = Math.floor(index / PAGE_SIZE) * PAGE_SIZE
  res.send({ offset, mooc: isMooc })
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
  if (!req.user.isGrader && !req.user.isAdmin) throw new Error('User is not authorized to report credits.')

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

const sendEmails = async (ccEmail, { missingStudents, batchId, failedInSisu }) => {
  const cc = ccEmail ? `${process.env.CC_RECEIVER},${ccEmail}` : process.env.CC_RECEIVER
  if (missingStudents.length)
    sendEmail({
      subject: `New completions reported with missing enrollment`,
      attachments: [
        {
          filename: 'suotar.png',
          path: `${process.cwd()}/client/assets/suotar.png`,
          cid: 'toskasuotarlogoustcid'
        }
      ],
      html: missingEnrolmentReport(missingStudents, batchId),
      cc
    })
  if (failedInSisu)
    sendEmail({
      subject: `Some completions failed in Sisu`,
      attachments: [
        {
          filename: 'suotar.png',
          path: `${process.cwd()}/client/assets/suotar.png`,
          cid: 'toskasuotarlogoustcid'
        }
      ],
      html: failedInSisuReport(batchId),
      cc
    })
}

/**
 * Send entries to Sisu using importer-db-api.
 * Request body should contain a list of entry ids to be sent to Sisu.
 */
const sendToSis = async (req, res) => {
  if (!req.user.isGrader && !req.user.isAdmin) {
    throw new Error('User is not authorized to report credits.')
  }

  const { entryIds = [], extraEntryIds = [] } = req.body

  if (!entryIds.length && !extraEntryIds.length) return res.status(400).send({ message: 'No entries to send' })

  const email = async (failedInSisu) => {
    const pick = entryIds[0] || extraEntryIds[0]
    const model = entryIds.length ? 'entry' : 'extraEntry'

    const rawEntry = await db.raw_entries.findOne({
      where: {
        [`$${model}.id$`]: pick
      },
      attributes: ['batchId'],
      include: [
        { model: db.entries, as: 'entry', attributes: ['id'] },
        { model: db.extra_entries, as: 'extraEntry', attributes: ['id'] }
      ],
      raw: true
    })
    const batchId = rawEntry ? rawEntry.batchId : null
    const rawEntries = await db.raw_entries.getByBatch(batchId)
    const missingStudents = rawEntries
      .filter(({ entry }) => entry.missingEnrolment)
      .map(({ studentNumber }) => studentNumber)
    sendEmails(req.user.email, { missingStudents, batchId, failedInSisu })
  }

  let [status, message] = []
  try {
    if (entryIds.length) {
      [status, message] = await attainmentsToSisu('entries', req)
    }
    if (extraEntryIds.length) {
      [status, message] = await attainmentsToSisu('extra_entries', req)
    }
    email(message && !message.genericError)
    if (message) return res.status(status).send(message)
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

  const { entryIds, extraEntryIds } = req.body
  const entries = await db.entries.findAll({
    where: {
      id: entryIds
    }
  })
  const extraEntries = await db.extra_entries.findAll({
    where: {
      id: extraEntryIds
    }
  })
  const success = await checkEntries(entries, 'entries')
  const successExtras = await checkEntries(extraEntries, 'extra_entries')
  if (!success || !successExtras) return res.status(400).send('Failed to refresh entries from Sisu')
  return res.status(200).send()
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
  getUnsentEntries,
  getUnsentBatchCount,
  getOffset
}
