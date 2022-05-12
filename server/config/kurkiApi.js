const axios = require('axios')

const kurkiApi = axios.create({
  params: {
    apiKey: process.env.KURKI_TOKEN || ''
  },
  baseURL: process.env.KURKI_ADDRESS
})

module.exports = kurkiApi
