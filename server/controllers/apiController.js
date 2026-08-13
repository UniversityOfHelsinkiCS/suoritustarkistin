const logger = require('@server/utils/logger')
const attainmentsToSisu = require('@server/utils/sendToSisu')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/processManualEntry')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount,
  isValidOodiDate,
  isValidCourseCode
} = require('../../utils/validators')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.toString() })
}

const getGrader = async (uid) => {
  if (!uid) return false

  const grader = await db.users.findOne({
    where: {
      uid
    },
    attributes: ['id', 'employeeId', 'uid', 'name']
  })

  if (!grader) return false

  return grader
}

const parseEntry = async (entry) => {
  const [studentId, grade, credits, _language, attainmentDate, course, grader] = entry.split(';')

  const { employeeId } = await getGrader(grader)

  return {
    studentId: isValidStudentId(studentId) && studentId,
    grade: isValidGrade(grade) && grade,
    credits: isValidCreditAmount(credits) && credits,
    attainmentDate: (isValidOodiDate(attainmentDate) && new Date(Date(attainmentDate))) || new Date(Date.now()),
    course: isValidCourseCode(course) && course,
    graderId: employeeId
  }
}

const createEntries = async (req, res) => {
  const { entries, senderUid } = req.body

  if (!Array.isArray(entries) || !entries.length) {
    return res.status(400).json({ error: 'Incorrect data' })
  }

  const parsedEntries = await Promise.all(entries.map(parseEntry))

  const validationFailed = parsedEntries
    .map(Object.values)
    .flat()
    .some((value) => !value)
  if (validationFailed) return res.status(400).json({ error: 'Incorrect data' })

  const user = await getGrader(senderUid)
  if (!user) return res.status(400).json({ error: 'Unknown sender' })

  const transaction = await db.sequelize.transaction()
  let result
  try {
    result = await processManualEntry({ reporterId: user.id, data: parsedEntries }, transaction)
    if (result.message !== 'success') {
      await transaction.rollback()
      logger.error({ message: `[API] Processing new completions failed` })
      return res.status(400).json({ error: result.message })
    }
    await transaction.commit()
    logger.info({ message: '[API] Report of new completions created successfully.' })
  } catch (error) {
    logger.error({ message: `[API] Processing new completions failed: ${error.message}`, stack: error.stack })
    await transaction.rollback()
    return handleDatabaseError(res, error)
  }

  try {
    const orphans = await db.raw_entries.deleteOrphans(result.batchId)
    if (orphans) logger.warn(`Deleted ${JSON.stringify(orphans)} orphans`)
    const rawEntries = await db.raw_entries.getByBatch(result.batchId)

    const entryIds = rawEntries.filter(({ entry }) => !entry.missingEnrolment).map(({ entry }) => entry.id)

    let [status, message] = []
    if (entryIds.length) {
      ;[status, message] = await attainmentsToSisu('entries', { user, body: { entryIds } })
    }

    return res.status(201).json({
      message: status === 200 ? undefined : message,
      isMissingEnrollment: result.isMissingEnrollment,
      rows: rawEntries,
      batchId: result.batchId
    })
  } catch (error) {
    logger.error({
      message: `[API] Entries created, but processing them afterwards failed: ${error.message}`,
      stack: error.stack
    })
    return res.status(500).json({ error: `Entries created, but sending them to Sisu failed: ${error.message}` })
  }
}

module.exports = {
  createEntries
}
