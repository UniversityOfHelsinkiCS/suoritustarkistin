const logger = require('@utils/logger')
const db = require('../models/index')
const { processManualEntry } = require('../scripts/processManualEntry')
const {
  isValidStudentId,
  isValidGrade,
  isValidCreditAmount,
  isValidLanguage,
  isValidOodiDate,
  isValidCourseCode
} = require('../../utils/validators')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.toString() })
}

const getGraderId = async (uid) => {
  const grader = await db.users.findOne({
    where: {
      uid
    },
    attributes: ['id', 'employeeId']
  })

  if (!grader) return false

  return grader
}

const parseEntry = async (entry) => {
  const [
    studentId,
    grade,
    credits,
    language,
    attainmentDate,
    course,
    grader
   ] = entry.split(';')

   const { id, employeeId } = await getGraderId(grader)

   return {
    studentId: isValidStudentId(studentId) && studentId,
    grade: isValidGrade(grade) && grade,
    credits: isValidCreditAmount(credits) && credits,
    language: isValidLanguage(language) && language,
    attainmentDate: isValidOodiDate(attainmentDate) && new Date(Date(attainmentDate)) || new Date(Date.now()),
    course: isValidCourseCode(course) && course,
    reporterId: id,
    graderId: employeeId
  }
}

const createEntries = async (req, res) => {
  const { entries } = req.body
  const parsedEntries = await Promise.all(entries.map(parseEntry))

  const validationFailed = parsedEntries.map(Object.values).flat().some((value) => !value)
  if (validationFailed)
    res.status(400).json({ error: 'Incorrect data' })

  const { reporterId } = parsedEntries[0]

  const transaction = await db.sequelize.transaction()
  try {
    const result = await processManualEntry({ reporterId, data: parsedEntries }, transaction)
    if (result.message === 'success') {
      await transaction.commit()
      logger.info({ message: '[API] Report of new completions created successfully.' })
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
    logger.error({ message: `[API] Processing new completions failed` })
  } catch (error) {
    logger.error(error)
    logger.error(error.stack)
    await transaction.rollback()
    handleDatabaseError(res, error)
  }
}

module.exports = {
  createEntries
}
