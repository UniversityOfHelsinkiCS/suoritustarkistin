require('module-alias/register')
const {
  checkRegisteredForMoocDebug
} = require('./checkSisEntries')

const main = async () => {
  console.log('Checking registered for mooc')
  await checkRegisteredForMoocDebug()
}

main()