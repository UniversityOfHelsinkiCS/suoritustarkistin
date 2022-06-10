const axios = require('axios')

const newMoocApi = axios.create({
  headers: {
    Authorization: process.env.MOOC_TOKEN || ''
  },
  baseURL: process.env.NEW_MOOC_ADDRESS
})

module.exports = newMoocApi
