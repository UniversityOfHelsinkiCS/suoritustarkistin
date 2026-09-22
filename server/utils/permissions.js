const { Op } = require('sequelize')

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
  permissionClass(req, res, next, (req) => req.user && (req.user.isGrader || req.user.isAdmin), 'Unauthorized access')

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
        attributes: ['graderId']
      })
      if (!rawEntry) return false
      if (rawEntry.graderId !== req.user.id) return false
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
        attributes: ['graderId'],
        include: [
          { model: db.entries, as: 'entry' },
          { model: db.extra_entries, as: 'extraEntry' }
        ]
      })
      if (!rawEntry) return false
      if (rawEntry.entry && rawEntry.entry.sent) return false
      if (rawEntry.extraEntry && rawEntry.extraEntry.sent) return false
      return rawEntry.graderId === req.user.id
    },
    'Unauthorized access'
  )

module.exports = {
  checkGrader,
  checkAdmin,
  checkToken,
  checkMoocfiToken,
  checkIdMatch,
  deleteSingleEntry,
  deleteBatch
}
