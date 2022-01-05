const axios = require('axios')


const api = axios.create({
  headers: {
    token: process.env.IMPORTER_DB_API_TOKEN || ''
  },
  baseURL: process.env.IMPORTER_DB_API_URL
})

api.interceptors.request.use(request => {
  console.log("SEND")
  console.log(request.url, JSON.stringify(request.data))
  return request
})

api.interceptors.response.use(response => {
  console.log("RESPONSE")
  console.log(JSON.stringify(response.data))
  return response
})

module.exports = api
