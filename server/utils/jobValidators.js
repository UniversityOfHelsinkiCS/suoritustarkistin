const cron = require('node-cron')
const { isValidJob: hasValidJobFields } = require('@shared/validators')

const isValidJob = (job) => hasValidJobFields(job) && cron.validate(job.schedule)

module.exports = { isValidJob }
