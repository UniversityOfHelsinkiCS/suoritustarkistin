const axios = require('axios')

const api = axios.create({
  headers: {
    token: process.env.IMPORTER_DB_API_TOKEN || ''
  },
  baseURL: process.env.IMPORTER_DB_API_URL,
  timeout: 120_000
})

module.exports = api
