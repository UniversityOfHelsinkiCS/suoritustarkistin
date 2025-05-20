/* eslint-disable no-console */
require('module-alias/register')
const {
  checkRegisteredForMooc
} = require('./checkSisEntries')

const main = async () => {
  console.log('starting checkRegisteredForMooc')
  await checkRegisteredForMooc()
  console.log('Done')
   process.exit(1)
}

main()