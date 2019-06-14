import axios from 'axios'
import { BACKEND_API_BASE } from '../config/config'
const baseUrl = `${BACKEND_API_BASE}/reports`

const createNew = async (token, report) => {
  const response = await axios.post(baseUrl, report, {
    headers: {
      Authorization: token
    }
  })
  return response.data
}

export default { createNew }
