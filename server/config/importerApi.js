const axios = require('axios')
const http = require('http')
const https = require('https')

// Node 19+ defaults the global agent to keepAlive: true, which reuses pooled
// connections the importer (or a proxy in front of it) may have already closed,
// causing intermittent "socket hang up" (ECONNRESET). Use fresh connections per
// request to restore the Node 14 behaviour.
// https://github.com/axios/axios/discussions/6277
const api = axios.create({
  headers: {
    token: process.env.IMPORTER_DB_API_TOKEN || ''
  },
  baseURL: process.env.IMPORTER_DB_API_URL,
  timeout: 120_000,
  httpAgent: new http.Agent({ keepAlive: false }),
  httpsAgent: new https.Agent({ keepAlive: false })
})

module.exports = api
