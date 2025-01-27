require('module-alias/register')
const {
  checkRegisteredForNewMooc
} = require('./checkSisEntries')

const main = async () => {
  await checkRegisteredForNewMooc()
}

main()