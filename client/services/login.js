import axios from 'axios'

const baseUrl = `${__BASE_PATH__}api/login` // BASE_PATH comes from webpack.config.js

const login = async () => {
  const { data } = await axios.post(baseUrl)
  return data
}

export default { login }
