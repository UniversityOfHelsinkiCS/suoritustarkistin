require('module-alias/register')
const {
  checkRegisteredForNewMooc
} = require('./checkSisEntries')

const main = async () => {
  /*
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('Usage: node server/scripts/debug.js <number>')
    process.exit(1)
  }
  const number = parseInt(args[0], 10)
  if (Number.isNaN(number)) {
    process.exit(1)
  }
  console.log('Checking', number, 'entries')
*/
  await checkRegisteredForNewMooc()
}

main()