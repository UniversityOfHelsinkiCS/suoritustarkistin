import axios from 'axios'
import { BACKEND_API_BASE } from '../config/config'
const baseUrl = `${BACKEND_API_BASE}/courses`

const getAll = async () => {
  const courses = await axios.get(baseUrl)
  return courses.data
}

export default { getAll }
