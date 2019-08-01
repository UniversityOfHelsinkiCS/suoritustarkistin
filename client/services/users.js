import axios from 'axios'

const baseUrl = `${__API_BASE__}/users` // API_BASE comes from webpack.config.js

const getAll = async () => {
  const users = await axios.get(baseUrl)
  return users.data
}

export default { getAll }
