const { checkRegisteredForMooc } = require('../scripts/checkSisEntries')
const { runJob: runCronJob } = require('../scripts/cronjobs')

const dryRunJobs = async (req, res) => {
  if (req.query.token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // eslint-disable-next-line no-console
  console.log("Suotar: checkRegisteredForMooc dryrun triggered")
  res.status(200).json({ message: "Suotar: checkRegisteredForMooc dryrun done" })
}

const runJobs = async (req, res) => {
  if (req.query.token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log("Suotar: register BAI")
  await runCronJob(27)

  // eslint-disable-next-line no-console
  console.log("Suotar: checkRegisteredForMooc triggered")
  await checkRegisteredForMooc()
  res.status(200).json({ message: "Suotar: checkRegisteredForMooc done" })
}

module.exports = {
  runJobs, dryRunJobs
}
