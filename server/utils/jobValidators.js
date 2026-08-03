const cron = require('node-cron')
const { isValidJob: hasValidJobFields } = require('@root/utils/validators')

const isValidJob = (job) => hasValidJobFields(job) && cron.validate(job.schedule)

module.exports = { isValidJob }
