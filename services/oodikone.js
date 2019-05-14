const axios = require('axios')

const hasOodiEntry = async (studentNumber, course) => {
  const entries = await axios.get(
    `https://oodikone.cs.helsinki.fi/moocs/students/${studentNumber}`,
    {
      headers: {
        Authorization: process.env.OODIKONE_TOKEN
      }
    }
  )

  for (const entry of entries) {
    if (entry.learningopportunity_id === course) {
      return true
    }
  }
  return false
}

module.exports = hasOodiEntry
