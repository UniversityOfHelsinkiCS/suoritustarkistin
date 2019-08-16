import axios from 'axios'

const baseUrl = `${__API_BASE__}/login` // API_BASE comes from webpack.config.js

const login = async () => {
  const { data } = await axios.post(baseUrl)
  return data
}

export default { login }
