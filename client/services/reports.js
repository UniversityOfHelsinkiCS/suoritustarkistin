import axios from 'axios'

const baseUrl = `${__BASE_PATH__}/api/reports` // BASE_PATH comes from webpack.config.js

const createNew = async (report) => {
  const response = await axios.post(baseUrl, report)
  return response.data
}

export default { createNew }
