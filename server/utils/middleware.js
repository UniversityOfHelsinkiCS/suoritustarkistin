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

const errorMiddleware = (req, res, next) => {
  const oldWrite = res.write, oldEnd = res.end

  const chunks = []

  res.write = function (chunk) {
    chunks.push(chunk)
    return oldWrite.apply(res, arguments)
  }

  res.end = function (chunk) {
    if (chunk)
      chunks.push(chunk)

    const { statusCode } = res
    if (statusCode >= 400 && req.headers.uid !== 'ohj_tosk') {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      const { originalUrl, method, query } = req
      const errorMsg = body.error || ''
      const message = `Response ${originalUrl} failed with status code ${statusCode} - ${errorMsg}`
      logger.info({ originalUrl, body: JSON.stringify(body), method, query, message })
      Sentry.withScope((scope) => {
        scope.setUser(req.user ? req.user.get({ plain: true }) : null)
        scope.setExtras({
          originalUrl, body: JSON.stringify(body), method, query
        })
        Sentry.captureMessage(message)
      })
    }
    oldEnd.apply(res, arguments)
  }

  next()
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
  requestLogger,
  parseUser,
  currentUser,
  errorMiddleware
}
