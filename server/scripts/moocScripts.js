const processMoocCompletions = require('./processMoocCompletions')
const processEoaiCompletions = require('./processEoaiCompletions')
const logger = require('@utils/logger')

const now = () => new Date(Date.now())

const processEoai = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} manual run: Processing new EoAI completions.`
  )
  processEoaiCompletions(['AYTKT21018', 'AYTKT21018fi', 'AYTKT21018sv'])
}

const processCybsec1 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec1 completions.`
  )
  processMoocCompletions(
    'AY5823951',
    'Open uni: Cyber Security Base: Introduction to Cyber Security',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    '37786'
  )
}

const processCybsec2 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec2 completions.`
  )
  processMoocCompletions(
    'AY5823952',
    'Open uni: Cyber Security Base: Securing Software',
    '3,0',
    process.env.CYBSEC_TEACHERCODE,
    '37787'
  )
}

const processCybsec3 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec3 completions.`
  )
  processMoocCompletions(
    'AY5823953',
    'Open uni: Cyber Security Base: Course Project I',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    '37788'
  )
}

const processCybsec4 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec4 completions.`
  )
  processMoocCompletions(
    'AY5823954',
    'Open uni: Cyber Security Base: Advanced Topics',
    '3,0',
    process.env.CYBSEC_TEACHERCODE,
    '37789'
  )
}

const processCybsec5 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} manual run: Processing new cybsec5 completions.`
  )
  processMoocCompletions(
    'AY5823955',
    'Open uni: Cyber Security Base: Course Project II',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    '36977'
  )
}

const processCybsec6 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} manual run: Processing new cybsec5 completions.`
  )
  processMoocCompletions(
    'AY5823956',
    'Open uni: Cyber Security Base: Capture The Flag',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    '36978'
  )
}

module.exports = {
  processEoai,
  processCybsec1,
  processCybsec2,
  processCybsec3,
  processCybsec4,
  processCybsec5,
  processCybsec6
}
