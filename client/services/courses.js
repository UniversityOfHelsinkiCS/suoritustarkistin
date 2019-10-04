import axios from 'axios'

const baseUrl = `${__BASE_PATH__}api/courses` // BASE_PATH comes from webpack.config.js

const getAll = async () => {
  const courses = await axios.get(baseUrl)
  return courses.data
}

export default { getAll }
