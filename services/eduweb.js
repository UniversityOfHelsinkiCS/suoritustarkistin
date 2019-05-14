const axios = require('axios')

const getRegistrations = async (course) => {
  const { data } = await axios.get(
    `https://www.avoin.helsinki.fi/eduweb/api/?course=${course}`,
    {
      headers: {
        Authorized: process.env.EDUWEB_TOKEN
      }
    }
  )
  const instances = data.map((instance) => instance.url)

  let participants = []
  for (const instance of instances) {
    const { data } = await axios.get(
      `https://www.avoin.helsinki.fi/eduweb/api/?course=${instance}`,
      {
        headers: {
          Authorized: process.env.EDUWEB_TOKEN
        }
      }
    )
    participants = participants.concat(data)
  }
  console.log(`Found ${participants.length} registrations for ${course}`)
  return participants
}

module.exports = getRegistrations
