const logger = require('@server/utils/logger')
const db = require('../models/index')
const { resolveApiKey, MOOCFI_CLIENT } = require('./apiKeys')

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
  const { authorization, token } = req.headers
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined

  const apiKey = await resolveApiKey(bearer || token, MOOCFI_CLIENT)
  if (!apiKey) {
    logger.info({ message: 'Failed mooc.fi token check', path: req.path })
    return res.status(401).json({ error: { code: 'unauthorized', message: 'Missing or invalid credentials.' } })
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

const deleteSingleEntry = (req, res, next) =>
  permissionClass(
    req,
    res,
    next,
    async (req) => {
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
