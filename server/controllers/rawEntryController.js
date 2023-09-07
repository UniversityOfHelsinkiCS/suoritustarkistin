const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/processManualEntry')
const { getCourseUnitEnrolments, getEarlierAttainments } = require('../services/importer')
const { missingEnrolmentReport } = require('../utils/emailFactory')
const sendEmail = require('../utils/sendEmail')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.toString() })
}

const addRawEntries = async (req, res) => {
  const transaction = await db.sequelize.transaction()
  try {
    if (!req.user.isGrader && !req.user.isAdmin) {
      logger.error({ message: 'User is not authorized to report completions', user: req.user.name })
      return res.status(400).json({ error: 'User is not authorized to report completions.' })
    }

    const { courseId, graderId, date, data, isKandi } = req.body
    if (!graderId) {
      logger.error({
        message: 'Unsuccessful upload: missing form fields',
        user: req.user.name,
        courseId,
        graderId,
        date
      })
      return res.status(400).json({ error: 'Grader missing!' })
    }

    if (!data) {
      logger.error({
        message: 'Unsuccessful upload: missing form fields',
        user: req.user.name,
        courseId,
        graderId,
        date
      })
      return res.status(400).json({ error: 'Data missing!' })
    }

    logger.info({ message: 'Raw sis entries', graderId, date, data: JSON.stringify(data), isKandi })

    const result = await processManualEntry(
      {
        graderId,
        reporterId: req.user.id,
        courseId,
        date: date || new Date(),
        data,
        isKandi
      },
      transaction
    )
    if (result.message === 'success') {
      await transaction.commit()
      logger.info({ message: 'Report of new completions created successfully.' })
      const orphans = await db.raw_entries.deleteOrphans(result.batchId)
      if (orphans) logger.warn(`Deleted ${JSON.stringify(orphans)} orphans`)
      const rawEntries = await db.raw_entries.getByBatch(result.batchId)
      return res.status(200).json({
        message: 'report created successfully',
        isMissingEnrollment: result.isMissingEnrollment,
        rows: rawEntries,
        batchId: result.batchId
      })
    }
    await transaction.rollback()
    logger.error({ message: `Processing new completions failed` })
    return res.status(400).json({ message: 'Processing new completions failed', failed: result.failed })
  } catch (error) {
    logger.error(error)
    logger.error(error.stack)
    await transaction.rollback()
    handleDatabaseError(res, error)
  }
}

const importStudents = async (req, res) => {
  const { code } = req.params
  const data = await getCourseUnitEnrolments(code)
  return res.send(data)
}

const importStudentsAttainments = async (req, res) => {
  const data = req.body
  const respData = await getEarlierAttainments(data)
  return res.send(respData)
}

const notifyMissingEnrollment = async (req, res) => {
  const { batchId } = req.params
  const rawEntries = await db.raw_entries.getByBatch(batchId)
  const missingStudents = rawEntries
    .filter(({ entry }) => entry.missingEnrolment)
    .map(({ studentNumber }) => studentNumber)
  const to = req.user.email || process.env.EMAIL_RECEIVER
  const cc = req.user.email ? `${process.env.CC_RECEIVER},${req.user.email}` : process.env.CC_RECEIVER

  await sendEmail({
    subject: `New completions reported with missing enrollment`,
    attachments: [
      {
        filename: 'suotar.png',
        path: `${process.cwd()}/client/assets/suotar.png`,
        cid: 'toskasuotarlogoustcid'
      }
    ],
    html: missingEnrolmentReport(missingStudents, batchId),
    to,
    cc
  })
  return res.status(200).send()
}

module.exports = {
  addRawEntries,
  importStudents,
  notifyMissingEnrollment,
  importStudentsAttainments
}
