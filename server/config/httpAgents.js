const http = require('http')
const https = require('https')

/**
 * Node 19+ defaults the global agent to keepAlive: true, which reuses pooled
 * connections the upstream (or a proxy in front of it) may have already closed,
 * causing intermittent "socket hang up" (ECONNRESET). Every outbound client here
 * uses fresh connections per request, restoring the Node 14 behaviour.
 * https://github.com/axios/axios/discussions/6277
 */
const httpAgent = new http.Agent({ keepAlive: false })
const httpsAgent = new https.Agent({ keepAlive: false })

module.exports = { httpAgent, httpsAgent }
