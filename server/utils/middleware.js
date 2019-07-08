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

module.exports = { checkSuotarToken, checkCSVToken, notInProduction }
