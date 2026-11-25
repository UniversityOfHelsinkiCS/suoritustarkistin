const { Op } = require('sequelize')

const { canReport } = require('@shared/common')
const logger = require('@server/utils/logger')
const db = require('../models/index')
const { resolveApiKey } = require('./apiKeys')
const { moocfiLogger } = require('./moocfiLogger')
const { REQUEST_CODES, MESSAGES } = require('./moocfiResults')

/**
 * Reusable permission check
 * @param {*} predicate Method to evaluate permission, may be async. Request is passed to method when evaluating.
 * @param {*} error Error message to return
 * @returns func
 */
const permissionClass = async (req, res, next, predicate, error) => {
  if (await predicate(req)) return next()
  logger.warn({ message: error, user: req.user })
  return res.status(401).send({ error })
}

const checkGrader = (req, res, next) =>
  permissionClass(req, res, next, (req) => canReport(req.user), 'Unauthorized access')

const checkAdmin = (req, res, next) =>
  permissionClass(req, res, next, (req) => req.user && req.user.isAdmin, 'Unauthorized access')

const checkToken = (req, res, next) => {
  const { SUOTAR_TOKEN } = process.env
  const { query, headers } = req

  if (!SUOTAR_TOKEN || (query.token !== SUOTAR_TOKEN && headers.token !== SUOTAR_TOKEN)) {
    logger.info({ message: 'Failed token check', tokenConfigured: !!SUOTAR_TOKEN, uid: headers.uid })
    return res.status(401).end()
  }

  next()
}

// Machine auth for the courses.mooc.fi batch API. Deliberately uncached: a cache would
// keep revoked keys working.
const checkMoocfiToken = async (req, res, next) => {
  const { authorization } = req.headers
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined

  const apiKey = await resolveApiKey(bearer)
  if (!apiKey) {
    moocfiLogger(req.originalUrl).warn('Failed mooc.fi token check', { status: 401, bearer: !!bearer })
    return res
      .status(401)
      .json({ error: { code: REQUEST_CODES.unauthorized, message: MESSAGES[REQUEST_CODES.unauthorized] } })
  }

  req.apiKey = apiKey
  next()
}

const checkIdMatch = (req, res, next) =>
  permissionClass(
    req,
    res,
    next,
    (req) => req.user && Number(req.params.id) === req.user.id,
    'Unauthorized: User id mismatch'
  )

const isMoocfiImport = async (where) =>
  Boolean(await db.raw_entries.findOne({ where: { ...where, moocfiRequestItemId: { [Op.not]: null } } }))

// The user graded it, or reported it (a KOPA user reporting for another grader)
const isOwnEntry = (user, rawEntry) => rawEntry.graderId === user.id || rawEntry.reporterId === user.id

const deleteSingleEntry = (req, res, next) =>
  permissionClass(
    req,
    res,
    next,
    async (req) => {
      if (await isMoocfiImport({ id: req.params.id })) return false
      if (req.user.isAdmin) return true
      const rawEntry = await db.raw_entries.findOne({
        where: { id: req.params.id },
        include: [
          { model: db.entries, as: 'entry' },
          { model: db.extra_entries, as: 'extraEntry' }
        ],
        attributes: ['graderId', 'reporterId']
      })
      if (!rawEntry) return false
      if (!isOwnEntry(req.user, rawEntry)) return false
      if (rawEntry.entry?.sent) return false
      return rawEntry.entry?.missingEnrolment || rawEntry.extraEntry?.id
    },
    'Unauthorized access'
  )

const deleteBatch = (req, res, next) =>
  permissionClass(
    req,
    res,
    next,
    async (req) => {
      if (await isMoocfiImport({ batchId: req.params.batchId })) return false
      if (req.user.isAdmin) return true
      const rawEntry = await db.raw_entries.findOne({
        where: { batchId: req.params.batchId },
        attributes: ['graderId', 'reporterId'],
        include: [
          { model: db.entries, as: 'entry' },
          { model: db.extra_entries, as: 'extraEntry' }
        ]
      })
      if (!rawEntry) return false
      if (rawEntry.entry && rawEntry.entry.sent) return false
      if (rawEntry.extraEntry && rawEntry.extraEntry.sent) return false
      return isOwnEntry(req.user, rawEntry)
    },
    'Unauthorized access'
  )

/**
 * May `user` report completions in the name of the grader with `graderEmployeeId`?
 * Admins may name anyone and graders themselves. A KOPA user may also name a grader of a
 * KOPA course, but only when every course in the report is a KOPA course that grader grades.
 */
const canReportAsGrader = async (user, graderEmployeeId, courseIds) => {
  if (user.isAdmin) return true
  if (user.isGrader && String(user.employeeId) === String(graderEmployeeId)) return true
  if (!user.isKopa || !courseIds.length) return false

  const grader = await db.users.findOne({
    where: { employeeId: String(graderEmployeeId) },
    include: [
      {
        model: db.courses,
        as: 'courses',
        where: { id: courseIds, isKopa: true },
        attributes: ['id'],
        through: { attributes: [] }
      }
    ]
  })
  return Boolean(grader && grader.courses.length === new Set(courseIds).size)
}

module.exports = {
  canReportAsGrader,
  checkGrader,
  checkAdmin,
  checkToken,
  checkMoocfiToken,
  checkIdMatch,
  deleteSingleEntry,
  deleteBatch
}
