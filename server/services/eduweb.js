const axios = require('axios')
const logger = require('@utils/logger')

const eduwebGet = async (course) => {
  const { data } = await axios.get(`${process.env.EDUWEB_URL}${course}`, {
    headers: {
      Authorized: process.env.EDUWEB_TOKEN
    }
  })
  return data
}

const getMultipleCourseRegistrations = async (courseNames) => {
  let registrationData = []

  for (const cn of courseNames) {
    const courseData = await getRegistrations(cn)

    registrationData = registrationData.concat(courseData)
  }

  return registrationData
}

const getRegistrations = async (course) => {
  logger.info({ message: `Fetching registrations for course ${course} from eduweb` })
  const instances = await eduwebGet(course)

  const registrations = await instances.reduce(async (accPromise, instance) => {
    const instanceRegistrations = await eduwebGet(instance.url)
    const acc = await accPromise

    return acc.concat(instanceRegistrations)
  }, [])

  logger.info({ message: `Found total of ${registrations ? registrations.length : 0} registrations` })
  return registrations
}

module.exports = { eduwebGet, getRegistrations, getMultipleCourseRegistrations }
