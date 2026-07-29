const axios = require('axios')
const { httpAgent, httpsAgent } = require('./httpAgents')

const api = axios.create({
  headers: {
    token: process.env.IMPORTER_DB_API_TOKEN || ''
  },
  baseURL: process.env.IMPORTER_DB_API_URL,
  timeout: 120_000,
  httpAgent,
  httpsAgent
})

module.exports = api
