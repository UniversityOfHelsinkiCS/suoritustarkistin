const { checkRegisteredForMooc } = require('../scripts/checkSisEntries')
const { runJob: runCronJob } = require('../scripts/cronjobs')

const dryRunJobs = async (req, res) => {
  if (req.query.token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // oxlint-disable-next-line no-console
  console.log('Suotar: checkRegisteredForMooc dryrun triggered')
  res.status(200).json({ message: 'Suotar: checkRegisteredForMooc dryrun done' })
}

const runJobs = async (req, res) => {
  if (req.query.token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // oxlint-disable-next-line no-console
  console.log('Suotar: register BAI')
  const baiResult = await runCronJob(27)

  // oxlint-disable-next-line no-console
  console.log('Suotar: checkRegisteredForMooc triggered')
  await checkRegisteredForMooc()

  if (!baiResult.ok) {
    return res.status(500).json({ error: `Suotar: register BAI failed: ${baiResult.message}` })
  }

  return res.status(200).json({ message: 'Suotar: checkRegisteredForMooc done' })
}

module.exports = {
  runJobs,
  dryRunJobs
}
