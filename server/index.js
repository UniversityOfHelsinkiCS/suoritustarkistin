const webpack = require('webpack')
const express = require('express')
const bodyParser = require('body-parser')
const cron = require('node-cron')
const routes = require('@utils/routes')
const logger = require('@utils/logger')
const { PORT, inProduction, inDevelopment, SHIBBOLETH_HEADERS } = require('@utils/common')
const { fakeShibbo } = require('./utils/fakeshibbo')
const { requestLogger, parseUser } = require('./utils/middleware')
const shibbolethCharsetMiddleware = require('unfuck-utf8-headers-middleware')

const processNewCompletions = require('./scripts/processNewCompletions')
const processOldCompletions = require('./scripts/processOldCompletions')
const checkOodiEntries = require('./scripts/checkOodiEntries')

const courseCodes = ['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv']

const app = express()
app.use(bodyParser.json({ limit: '5mb' }))

/**
 * Use hot loading when in development, else serve the static content
 */
if (inDevelopment) {
  /* eslint-disable */
  const middleware = require('webpack-dev-middleware')
  const hotMiddleWare = require('webpack-hot-middleware')
  const webpackConf = require('@root/webpack.config')
  /* eslint-enable */
  const compiler = webpack(webpackConf('development', { mode: 'development' }))
  app.use(middleware(compiler))
  app.use(hotMiddleWare(compiler))
  if (process.argv[2] && process.argv[2] === 'fakeshibbo') {
    logger.info('Using fakeshibbo headers.')
    app.use(fakeShibbo)
  }
  app.use(requestLogger)
} else {
  app.use('/', express.static('dist/'))
}
app.use(shibbolethCharsetMiddleware(SHIBBOLETH_HEADERS))
app.use(parseUser)

const now = () => new Date(Date.now())

let newCompletionTimestamp = null
let oldCompletionTimestamp = null
let oodiCheckTimestamp = null
const serverTimestamp = now()

if (process.argv[2] && process.argv[2] === 'processnew') {
  newCompletionTimestamp = now()
  logger.info(
    `${newCompletionTimestamp.toLocaleString()} manual run: Processing new EoAI completions.`
  )
  processNewCompletions(courseCodes)
}

if (process.argv[2] && process.argv[2] === 'processold') {
  oldCompletionTimestamp = now()
  logger.info(
    `${oldCompletionTimestamp.toLocaleString()} manual run: Processing old HY EoAI completions. (DEPRECATED)`
  )
  processOldCompletions(courseCodes[0])
}

if (process.argv[2] && process.argv[2] === 'checkoodi') {
  oodiCheckTimestamp = now()
  logger.info(
    `${oodiCheckTimestamp.toLocaleString()} manual run: Checking oodi entries.`
  )
  checkOodiEntries()
}

if (inProduction) {
  cron.schedule('0 4 * * 4', () => {
    newCompletionTimestamp = now()
    logger.info(
      `${newCompletionTimestamp.toLocaleString()} node-cron: Processing new EoAI completions.`
    )
    processNewCompletions(courseCodes)
  })

  cron.schedule('0 3 * * 5', () => {
    oodiCheckTimestamp = now()
    logger.info(
      `${oodiCheckTimestamp.toLocaleString()} node-cron: Checking oodi entries.`
    )
    checkOodiEntries()
  })
}

app.use('/api', routes)

app.get('/serverinfo', (req, res) => {
  const newStamp = newCompletionTimestamp
    ? newCompletionTimestamp.toLocaleString()
    : 'before server restart'
  const oldStamp = oldCompletionTimestamp
    ? oldCompletionTimestamp.toLocaleString()
    : 'before server restart'
  const oodiStamp = oodiCheckTimestamp
    ? oodiCheckTimestamp.toLocaleString()
    : 'before server restart'

  return res.status(200).send(
    `<h1>Suoritustarkistin serverinfo:</h1>
    <p>Server last restarted: ${serverTimestamp.toLocaleString()}</p>
    <p>New completions last processed: ${newStamp}</p>
    <p>Old HY completions last processed: ${oldStamp}</p>
    <p>Oodicheck last run: ${oodiStamp}</p>`
  )
})

app.listen(PORT, () => {
  logger.info(`Started on port ${PORT}`)
})
