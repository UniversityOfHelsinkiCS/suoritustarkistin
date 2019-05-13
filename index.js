require('dotenv').config()

const axios = require('axios')

const eduwebUrl = 'https://www.avoin.helsinki.fi/eduweb/api/?course='

const courseIds = axios
  .get(`${eduwebUrl}AYTKT21018`, {
    headers: {
      Authorized: process.env.EDUWEB_TOKEN
    }
  })
  .then((result) => console.log(result))
  .catch((error) => console.log(error.message))

const courseParticipants = courseId => axios
  .get(`${eduwebUrl}${courseId}`, {
    headers: {
      Authorized: process.env.EDUWEB_TOKEN
    }
  })
  .then((result) => console.log(result))
  .catch((error) => console.log(error.message))

courseParticipants(31897)
