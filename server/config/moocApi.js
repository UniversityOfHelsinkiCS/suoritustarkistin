const axios = require('axios')

const moocApi = axios.create({
  headers: {
    Authorization: process.env.MOOC_TOKEN || ''
  },
  baseURL: process.env.MOOC_ADDRESS
})

module.exports = moocApi