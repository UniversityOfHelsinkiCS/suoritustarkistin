import axios from 'axios'

const baseUrl = '/api/reports'

const createNew = async (token, report) => {
  const response = await axios.post(baseUrl, report, {
    headers: {
      Authorization: token,
    },
  })
  return response.data
}

export default { createNew }
