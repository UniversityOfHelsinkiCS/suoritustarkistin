const logger = require('@utils/logger')
const { inProduction } = require('./common')
const db = require('../models/index')

const checkGrader = (req, res, next) => permissionClass(
  req, res, next,
  (req) => req.user && (req.user.isGrader || req.user.isAdmin),
  'Unauthorized access'
)

const checkAdmin = (req, res, next) => permissionClass(
  req, res, next,
  (req) => req.user && req.user.isAdmin,
  'Unauthorized access'
)

const checkIdMatch = (req, res, next) => permissionClass(
  req, res, next,
  (req) => req.user && Number(req.params.id) === req.user.id,
  'Unauthorized: User id mismatch'
)

const notInProduction = (req, res, next) => permissionClass(
  req, res, next,
  () => !inProduction,
  `Test-only route (${req.method} ${req.url}) was requested while in production mode.`
)

const deleteSingleEntry = (req, res, next) => permissionClass(
  req, res, next,
  async (req) => {
    if (req.user.isAdmin) return true
    const rawEntry = await db.raw_entries.findOne({
      where: { id: req.params.id },
      include: [{ model: db.entries, as: 'entry' }, { model: db.extra_entries, as: 'extraEntry' }],
      attributes: ['graderId']
    })
    if (rawEntry.graderId !== req.user.id) return false
    if (rawEntry.entry.sent) return false
    return rawEntry.entry.missingEnrolment || rawEntry.extraEntry.id
  },
  'Unauthorized access'
)

const deleteBatch = (req, res, next) => permissionClass(
  req, res, next,
  async (req) => {
    if (req.user.isAdmin) return true
    const rawEntry = await db.raw_entries.findOne({
      where: { batchId: req.params.batchId },
      attributes: ['graderId'],
      include: [{ model: db.entries, as: 'entry' }, { model: db.extra_entries, as: 'extraEntry' }]
    })
    if (rawEntry.entry && rawEntry.entry.sent) return false
    if (rawEntry.extraEntry && rawEntry.extraEntry.sent) return false
    return rawEntry.graderId === req.user.id
  },
  'Unauthorized access'
)

/**
 * Reusable permission check
 * @param {*} predicate Method to evaluate permission, may be async. Request is passed to method when evaluating.
 * @param {*} error Error message to return
 * @returns func
 */
const permissionClass = async (req, res, next, predicate, error) => {
  if (await predicate(req))
    return next()
  logger.warn({ message: error, user: req.user })
  return res.status(401).send({ error })
}

module.exports = {
  checkGrader,
  checkAdmin,
  checkIdMatch,
  notInProduction,
  deleteSingleEntry,
  deleteBatch
}
