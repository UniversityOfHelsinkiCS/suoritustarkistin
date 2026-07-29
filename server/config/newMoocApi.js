const axios = require('axios')
const { httpAgent, httpsAgent } = require('./httpAgents')

const newMoocApi = axios.create({
  headers: {
    Authorization: process.env.NEW_MOOC_TOKEN || ''
  },
  baseURL: process.env.NEW_MOOC_ADDRESS,
  httpAgent,
  httpsAgent
})

module.exports = newMoocApi
