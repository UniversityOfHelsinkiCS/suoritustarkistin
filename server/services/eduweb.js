const axios = require('axios')
const https = require('https')
const logger = require('@utils/logger')

const eduwebGet = async (course) => {
  const { data } = await axios.get(`${process.env.EDUWEB_URL}${course}`, {
    headers: {
      Authorized: process.env.EDUWEB_TOKEN
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })

  return data
}

const getRegistrations = async (course) => {
  logger.info({ message: `Fetching registrations for course ${course} from eduweb` })

  const instances = await eduwebGet(course)

  const registrations = await instances.reduce(async (accPromise, instance) => {
    const instanceRegistrations = await eduwebGet(instance.url)
    const acc = await accPromise

    return acc.concat(instanceRegistrations)
  }, [])

  logger.info({ message: `Found total of ${registrations ? registrations.length : 0} registrations, ${course}` })
  return registrations
}

const getMultipleCourseRegistrations = async (courseNames) => {
  let registrationData = []

  // eslint-disable-next-line no-restricted-syntax
  for (const cn of courseNames) {
    const courseData = await getRegistrations(cn)

    registrationData = registrationData.concat(courseData)
  }

  return registrationData
}

const getRegistrationsByInstance = async (course) => {
  const instances = await eduwebGet(course)

  const registrations = await instances.reduce(async (accPromise, instance) => {
    const { url } = instance
    const instanceRegistrations = await eduwebGet(url)
    const acc = await accPromise
    return { ...acc, [String(url)]: instanceRegistrations }
  }, {})
  return registrations
}

module.exports = { eduwebGet, getRegistrations, getMultipleCourseRegistrations, getRegistrationsByInstance }
