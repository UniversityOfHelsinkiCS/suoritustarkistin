const { inProduction } = require('./common')
const logger = require('@utils/logger')
const db = require('../models/index')
const sendNewUserEmail = require('./sendNewUserEmail')
const Sentry = require('@sentry/node')

const parseUser = async (req, res, next) => {
  if (req.headers.employeenumber) {
    try {
      const [user, created] = await db.users.findOrCreate({
        where: {
          employeeId: req.headers.employeenumber
        },
        defaults: {
          uid: req.headers.uid,
          email: req.headers.mail,
          name: `${req.headers.givenname} ${req.headers.sn}`,
          isGrader:
            false ||
            !!(req.headers.employeenumber === 'grader' && !inProduction),
          isAdmin:
            false ||
            !!(req.headers.employeenumber === 'admin' && !inProduction)
        }
      })
      if (created) {
        logger.info(`New user: ${user.name}, ${user.email}`)
        sendNewUserEmail(user)
      }
      req.user = user
    } catch (error) {
      logger.error('Database error:', error)
    }
  }
  next()
}

const currentUser = async (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    const loggedInAs = req.headers['x-admin-logged-in-as']
    if (loggedInAs) {
      let fakeUser = await db.users.findOne({
        where: { employeeId: loggedInAs }
      })

      req.user = fakeUser
    }
  }
  next()
}

const checkGrader = (req, res, next) => {
  if (req.user.isGrader || req.user.isAdmin) {
    next()
  } else {
    res.status(401).json({ error: 'Unauthorized access.' }).end()
  }
}

const checkAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next()
  } else {
    res.status(401).json({ error: 'Unauthorized access.' }).end()
  }
}

const checkIdMatch = (req, res, next) => {
  if (Number(req.params.id) === req.user.id) {
    next()
  } else {
    res.status(401).json({ error: 'Unauthorized: User id mismatch.' }).end()
  }
}

const checkSuotarToken = (req, res, next) => {
  if (req.headers.authorization === process.env.SUOTAR_TOKEN) {
    next()
  } else {
    return res.status(401).json({ error: 'Invalid token.' }).end()
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

const errorMiddleware = (req, res) => {
  const { statusCode } = res
  if (statusCode < 400)
    return

  const { originalUrl, method, query } = req
  const { body } = res.req // res.req :wat:

  const errorMsg = body.error || ''
  const message = `Response ${originalUrl} failed with status code ${statusCode} - ${errorMsg}`
  logger.info({ originalUrl, body, method, query, message })
  Sentry.withScope((scope) => {
    scope.setUser(req.user ? req.user.get({ plain: true }) : null)
    scope.setExtras({
      originalUrl, body, method, query
    })
    Sentry.captureMessage(message)
  })
}


const requestLogger = (req, res, next) => {
  logger.info(`Method: ${req.method}`)
  logger.info(`Path: ${req.path}`)
  logger.info(`Body: ${JSON.stringify(req.body)}`)
  logger.info(`User: ${req.headers.employeenumber}`)
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
  checkIdMatch,
  currentUser,
  errorMiddleware
}
