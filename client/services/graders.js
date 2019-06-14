import axios from 'axios'
import { BACKEND_API_BASE } from '../config/config'
const baseUrl = `${BACKEND_API_BASE}/graders`

const getAll = async () => {
  const graders = await axios.get(baseUrl)
  return graders.data
}

export default { getAll }
