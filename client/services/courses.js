import axios from 'axios'

const baseUrl = `${__API_BASE__}/courses` // API_BASE comes from webpack.config.js

const getAll = async () => {
  const courses = await axios.get(baseUrl)
  return courses.data
}

export default { getAll }
