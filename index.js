if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const processNewCompletions = require('./scripts/processNewCompletions')
const processOldCompletions = require('./scripts/processOldCompletions')
const fixMoocIds = require('./scripts/fixMoocIds')
const courseCodes = ['AYTKT21018']

if(process.env.PROCESS_COMPLETIONS==='true') {
  console.log('Processing completionIds.')
} else {
  console.log('Not processing completionIds.')
}
if (process.env.OLD_HY === 'true') {
  processOldCompletions(courseCodes[0])
} else if (process.env.FIX_MOOC === 'true') {
  fixMoocIds(courseCodes[0])
} else {
  courseCodes.forEach((course) => {
    processNewCompletions(course)
  })
}
