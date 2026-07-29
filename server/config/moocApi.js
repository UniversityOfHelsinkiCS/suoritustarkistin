const axios = require('axios')
const { httpAgent, httpsAgent } = require('./httpAgents')

const moocApi = axios.create({
  headers: {
    Authorization: process.env.MOOC_TOKEN || ''
  },
  baseURL: process.env.MOOC_ADDRESS,
  httpAgent,
  httpsAgent
})

module.exports = moocApi
