const { inProduction } = require('./common')
const logger = require('@utils/logger')
const db = require('../models/index')

const parseUser = async (req, res, next) => {
  if (req.headers.employeenumber) {
    try {
      const [user, created] = await db.users.findOrCreate({
        where: {
          employeeId: req.headers.employeenumber
        },
        defaults: {
          email: req.headers.mail,
          name: `${req.headers.givenname} ${req.headers.sn}`,
          isGrader: false,
          isAdmin: false
        }
      })
      if (created) logger.info(`New user: ${user.name}, ${user.email}`)
      req.user = user
    } catch (error) {
      logger.error('Database error:', error)
    }
  }
  next()
}

const checkGrader = (req, res, next) => {
  if (req.user.isGrader || req.user.isAdmin) {
    next()
  } else {
    res
      .status(401)
      .json({ error: 'Unauthorized access.' })
      .end()
  }
}

const checkAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next()
  } else {
    res
      .status(401)
      .json({ error: 'Unauthorized access.' })
      .end()
  }
}

const checkIdMatch = (req, res, next) => {
  if (Number(req.params.id) === req.user.id) {
    next()
  } else {
    res
      .status(401)
      .json({ error: 'Unauthorized: User id mismatch.' })
      .end()
  }
}

const checkSuotarToken = (req, res, next) => {
  if (req.headers.authorization === process.env.SUOTAR_TOKEN) {
    next()
  } else {
    return res
      .status(401)
      .json({ error: 'Invalid token.' })
      .end()
  }
}

const notInProduction = (req, res, next) => {
  if (!inProduction) {
    next()
  } else {
    logger.error(
      `Test-only route (${req.method} ${req.url}) was requested while in production mode.`
    )
    return res.status(404).end()
  }
}

const requestLogger = (req, res, next) => {
  logger.info(`Method: ${req.method}`)
  logger.info(`Path: ${req.path}`)
  logger.info(`Body: ${JSON.stringify(req.body)}`)
  logger.info('---')
  next()
}

module.exports = {
  checkSuotarToken,
  notInProduction,
  requestLogger,
  parseUser,
  checkGrader,
  checkAdmin,
  checkIdMatch
}
