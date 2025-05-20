const { checkRegisteredForMooc } = require('../scripts/checkSisEntries')

const runJobs = async (req, res) => {
  if (req.query.token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // eslint-disable-next-line no-console
  console.log("Suotar: checkRegisteredForMooc triggered")
  await checkRegisteredForMooc()
  res.status(200).json({ message: "Suotar: checkRegisteredForMooc done" })
}

module.exports = {
  runJobs
}
