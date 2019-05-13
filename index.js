require('dotenv').config()

const axios = require('axios')

const courseIds = axios
  .get('https://www.avoin.helsinki.fi/eduweb/api/?course=AYTKT21018', {
    headers: {
      Authorized: process.env.EDUWEB_TOKEN
    }
  })
  .then((result) => console.log(result))
  .catch((error) => console.log(error.message))

//console.log(courseIds)
