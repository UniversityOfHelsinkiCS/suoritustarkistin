import axios from 'axios'

const baseUrl = '/api/courses'

const getAll = async () => {
  const courses = await axios.get(baseUrl)
  return courses
}

export default { getAll }
