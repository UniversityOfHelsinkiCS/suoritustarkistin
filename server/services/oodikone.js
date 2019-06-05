const axios = require('axios')
const https = require('https')

const hasOodiEntry = async (studentNumber, course) => {
  const { data } = await axios.get(
    `https://oodikone.cs.helsinki.fi/moocs/students/${studentNumber}`,
    {
      headers: {
        Authorization: process.env.OODIKONE_TOKEN
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  )

  for (const entry of data) {
    if (
      entry.learningopportunity_id === course ||
      entry.learningopportunity_id === course + 'fi'
    ) {
      return true
    }
  }
  return false
}

module.exports = hasOodiEntry
