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
    process.env.CYBSEC_TEACHERCODE
  )
}

const processCybsec1_2020 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec1_2020 completions.`
  )
  processMoocCompletions(
    'AY5823951',
    'Open uni: Cyber Security Base: Introduction to Cyber Security',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    'introduction-to-cyber-security-2020'
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
    process.env.CYBSEC_TEACHERCODE
  )
}

const processCybsec2_2020 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec2_2020 completions.`
  )
  processMoocCompletions(
    'AY5823952',
    'Open uni: Cyber Security Base: Securing Software',
    '3,0',
    process.env.CYBSEC_TEACHERCODE,
    'securing-software-2020'
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
    'cyber-course-project-i'
  )
}

const processCybsec3_2020 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec3_2020 completions.`
  )
  processMoocCompletions(
    'AY5823953',
    'Open uni: Cyber Security Base: Course Project I',
    '1,0',
    process.env.CYBSEC_TEACHERCODE,
    'cyber-security-project-i-2020'
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
    'cyber-advanced-topics-2020'
  )
}

const processCybsec5 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec5 completions.`
  )
  processMoocCompletions(
    'AY5823955',
    'Open uni: Cyber Security Base: Course Project II',
    '1,0',
    process.env.CYBSEC_TEACHERCODE
  )
}

const processCybsec6 = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new cybsec6 completions.`
  )
  processMoocCompletions(
    'AY5823956',
    'Open uni: Cyber Security Base: Capture The Flag',
    '1,0',
    process.env.CYBSEC_TEACHERCODE
  )
}

const processOhPe = () => {
  const timestamp = now()
  logger.info(`${timestamp.toLocaleString()} Processing new OhPe completions.`)
  processMoocCompletions(
    'AYTKT10002',
    'Avoin yo: Ohjelmoinnin perusteet',
    '5,0',
    process.env.OHPE_TEACHERCODE,

    'fi'
  )
}

const processOhPePython = () => {
  const timestamp = now()
  logger.info(
    `${timestamp.toLocaleString()} Processing new OhPePython completions.`
  )
  processMoocCompletions(
    'AYTKT10002',
    'Avoin yo: Ohjelmoinnin perusteet',
    '5,0',
    process.env.OHPE_TEACHERCODE,
    'fi',
    'python-kesa-20'
  )
}

const processOhJa = () => {
  const timestamp = now()
  logger.info(`${timestamp.toLocaleString()} Processing new OhJa completions.`)
  processMoocCompletions(
    'AYTKT10003',
    'Avoin yo: Ohjelmoinnin jatkokurssi',
    '5,0',
    process.env.OHPE_TEACHERCODE,
    'fi'
  )
}

const processTiTo = () => {
  const timestamp = now()
  logger.info(`${timestamp.toLocaleString()} Processing new TiTo completions.`)
  processMoocCompletions(
    'AYTKT100051',
    'Avoin yo: Tietokoneen toiminnan perusteet',
    '2,0',
    process.env.TITO_TEACHERCODE,
    'fi'
  )
}

module.exports = {
  processEoai,
  processCybsec1,
  processCybsec2,
  processCybsec3,
  processCybsec1_2020,
  processCybsec2_2020,
  processCybsec3_2020,
  processCybsec4,
  processCybsec5,
  processCybsec6,
  processOhPe,
  processOhJa,
  processOhPePython,
  processTiTo
}
