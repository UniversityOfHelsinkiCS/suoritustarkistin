const webpack = require('webpack')
const express = require('express')
const bodyParser = require('body-parser')
const cron = require('node-cron')
const routes = require('@utils/routes')
const logger = require('@utils/logger')
const { PORT, inProduction } = require('@utils/common')

const processNewCompletions = require('./scripts/processNewCompletions')
const processOldCompletions = require('./scripts/processOldCompletions')
const reportsRouter = require('./controllers/reports')

const courseCodes = ['AYTKT21018', 'AYTKT21018fi']

const app = express()
/**
 * Use hot loading when in development, else serve the static content
 */
if (!inProduction) {
  /* eslint-disable */
  const middleware = require('webpack-dev-middleware')
  const hotMiddleWare = require('webpack-hot-middleware')
  const webpackConf = require('@root/webpack.config')
  /* eslint-enable */
  const compiler = webpack(webpackConf('development', { mode: 'development' }))
  app.use(middleware(compiler))
  app.use(hotMiddleWare(compiler))
} else {
  app.use('/', express.static('dist/'))
}

const now = () => new Date(Date.now())

let newCompletionTimestamp = null
let oldCompletionTimestamp = null
const oodiCheckTimestamp = null
const serverTimestamp = now()

if (process.argv[2] && process.argv[2] === 'processnew') {
  newCompletionTimestamp = now()
  console.log(
    `${newCompletionTimestamp.toLocaleString()} manual run: Processing new course completions.`
  )
  processNewCompletions(courseCodes)
}

if (process.argv[2] && process.argv[2] === 'processold') {
  oldCompletionTimestamp = now()
  console.log(
    `${oldCompletionTimestamp.toLocaleString()} manual run: Processing old HY course completions.`
  )
  processOldCompletions(courseCodes[0])
}

if (inProduction) {
  cron.schedule('0 4 * * 4', () => {
    newCompletionTimestamp = now()
    console.log(
      `${newCompletionTimestamp.toLocaleString()} node-cron: Processing new course completions.`
    )
    processNewCompletions(courseCodes)
  })

  cron.schedule('0 4 1 7 *', () => {
    newCompletionTimestamp = now()
    console.log(
      `${newCompletionTimestamp.toLocaleString()} node-cron: Processing new course completions (DEFA-special run).`
    )
    processNewCompletions(courseCodes)
  })

  cron.schedule('0 5 1,15 6,7,8 *', () => {
    oldCompletionTimestamp = now()
    console.log(
      `${oldCompletionTimestamp.toLocaleString()} node-cron: Processing old HY course completions.`
    )
    processOldCompletions(courseCodes[0])
  })

  /*
   cron.schedule('0 10 * * 2', () => {
    oodiCheckTimestamp = now()
    console.log(
      `${oodiCheckTimestamp.toLocaleString()} node-cron: Checking oodi entries.`
    )
    checkOodiEntries()
  }) */
}
app.use(bodyParser.json({ limit: '5mb' }))
app.use('/api/reports', reportsRouter)
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
    <p>Old HY completions last processed: ${oldStamp}</p>`
  )
})

app.listen(PORT, () => {
  logger.info(`Started on port ${PORT}`)
})
