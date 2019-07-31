const { inProduction } = require('./common')
const logger = require('@utils/logger')

const checkSuotarToken = (req, res, next) => {
  if (req.headers.authorization === process.env.SUOTAR_TOKEN) {
    next()
  } else {
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

const checkCSVToken = (req, res, next) => {
  if (req.headers.authorization === process.env.CSV_TOKEN) {
    next()
  } else {
    return res.status(401).json({ error: 'Invalid token.' })
  }
}

const notInProduction = (req, res, next) => {
  if (!inProduction) {
    next()
  } else {
    logger.error(
      `Test-only route (${req.method} ${
        req.url
      }) was requested while in production mode.`
    )
    return res.status(404).end()
  }
}

const fakeShibbo = (req, res, next) => {
  req.headers.employeenumber = '9876543'
  req.headers.mail = 'pekka.m.testaaja@helsinki.fi'
  req.headers.schacpersonaluniquecode =
    'urn:schac:personalUniqueCode:int:studentID:helsinki.fi:011110002'
  req.headers.uid = 'pemtest'
  req.headers.givenname = 'Pekka'
  req.headers.sn = 'Testaaja'
  next()
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
  checkCSVToken,
  notInProduction,
  fakeShibbo,
  requestLogger
}
