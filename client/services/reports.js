import axios from 'axios'

const baseUrl = `${__API_BASE__}/reports` // API_BASE comes from webpack.config.js

const createNew = async (report) => {
  const response = await axios.post(baseUrl, report)
  return response.data
}

export default { createNew }
