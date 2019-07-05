import axios from 'axios'

const baseUrl = `${__API_BASE__}/graders` // API_BASE comes from webpack.config.js

const getAll = async () => {
  const graders = await axios.get(baseUrl)
  return graders.data
}

export default { getAll }
