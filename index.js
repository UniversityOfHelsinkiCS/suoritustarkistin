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
// const courseCodes = ['AYTKT21018', 'AYTKT21018fi']
const courseCodes = ['AYTKT21018']

let newCompletionTimestamp = null
let oldCompletionTimestamp = null
let oodiCheckTimestamp = null

const now = () => {
  return new Date(Date.now())
}

cron.schedule('0 8 * * 3', () => {
  newCompletionTimestamp = now()
  console.log(
    `${newCompletionTimestamp.toLocaleString()} node-cron: Processing new course completions.`
  )
  processNewCompletions(courseCodes[0])
})

cron.schedule('0 8 * * 4', () => {
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
    `<p>New completions last processed: ${newStamp}</p>
      <p>Old HY completions last processed: ${oldStamp}</p>`
  )
})

server.listen(port, () =>
  console.log(`Server started, listening to port ${port}.`)
)
