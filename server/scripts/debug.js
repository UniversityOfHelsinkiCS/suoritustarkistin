/* eslint-disable no-console */
require('module-alias/register')
const { runJob } = require('./cronjobs')

const main = async () => {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('Usage: node server/scripts/debug.js <number>')
    process.exit(1)
  }
  const number = parseInt(args[0], 10)
  if (Number.isNaN(number)) {
    process.exit(1)
  }
  console.log('running', number)
  await runJob(number)
  console.log('Done')
}

main()