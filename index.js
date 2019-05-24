if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const cron = require('node-cron')
const express = require('express')

const server = express()
const port = process.env.PORT

const processNewCompletions = require('./scripts/processNewCompletions')
const processOldCompletions = require('./scripts/processOldCompletions')
const checkOodiEntries = require('./scripts/checkOodiEntries')
const fixMoocIds = require('./scripts/fixMoocIds')
const courseCodes = ['AYTKT21018', 'AYTKT21018fi']

let newCompletionTimestamp = null
let oldCompletionTimestamp = null
let oodiCheckTimestamp = null

const now = () => {
  return new Date(Date.now())
}

fixMoocIds(courseCodes[0])

cron.schedule('0 4 * * 4', () => {
  newCompletionTimestamp = now()
  console.log(
    `${newCompletionTimestamp.toLocaleString()} node-cron: Processing new course completions.`
  )
  processNewCompletions(courseCodes)
})

cron.schedule('0 5 * * 4', () => {
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

const serverTimestamp = now()

server.get('/', (req, res) => {
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
    `<p>Server last restarted: ${serverTimestamp.toLocaleString()}</p>
    <p>New completions last processed: ${newStamp}</p>
    <p>Old HY completions last processed: ${oldStamp}</p>`
  )
})

server.listen(port, () =>
  console.log(`Server started, listening to port ${port}.`)
)
