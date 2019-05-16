if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const processNewCompletions = require('./scripts/processNewCompletions')

const courseCodes = ['AYTKT21018']

courseCodes.forEach((course) => {
  processNewCompletions(course)
})
