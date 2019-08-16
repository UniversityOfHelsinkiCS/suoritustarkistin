import axios from 'axios'

const baseUrl = `${__API_BASE__}/users` // API_BASE comes from webpack.config.js

const getAll = async () => {
  const users = await axios.get(baseUrl)
  return users.data
}

const getGraders = async () => {
  const graders = await axios.get(`${baseUrl}/graders`)
  return graders.data
}

const getCurrentUser = async () => {
  const user = await axios.get(`${baseUrl}/current`)
  return user.data
}

export default { getAll, getGraders, getCurrentUser }
