const axios = require('axios')

const api = axios.create({
    headers: {
        token: process.env.IMPORTER_DB_API_TOKEN || ''
    },
    baseURL: process.env.IMPORTER_DB_API_URL
})

module.exports = { api }
