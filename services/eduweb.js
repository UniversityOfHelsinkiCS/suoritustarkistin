const axios = require('axios')

const eduwebGet = async (course) => {
  const { data } = await axios.get(
    `https://www.avoin.helsinki.fi/eduweb/api/?course=${course}`,
    {
      headers: {
        Authorized: process.env.EDUWEB_TOKEN
      }
    }
  )
  return data
}

const getRegistrations = async (course) => {
  const instances = await eduwebGet(course)

  const registrations = await instances.reduce(async (accPromise, instance) => {
    const instanceRegistrations = await eduwebGet(instance.url)
    const acc = await accPromise

    return acc.concat(instanceRegistrations)
  }, [])

  return registrations
}

module.exports = getRegistrations
