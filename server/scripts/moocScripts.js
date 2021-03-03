const processEoaiCompletions = require('./processEoaiCompletions')
const processBaiCompletions = require('./processBaiCompletions')
const logger = require('@utils/logger')

const now = () => new Date(Date.now())

const processEoai = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} manual run: Processing new EoAI completions.`
  )
  processEoaiCompletions(['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv'])
}

const processBuildingai = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} manual run: Processing new BuildingAI completions.`
  )
  processBaiCompletions(
    'AYTKT21028en',
    'Elements of AI: Building AI',
    { 1: '0,0', 2: '1,0', 3: '2,0' }, // Tier credit amounts
    process.env.TEACHERCODE,
    'en',
    'building-ai'
  )
}

module.exports = {
  processEoai,
  processBuildingai
}
