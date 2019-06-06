import axios from 'axios'

const baseUrl = '/api/graders'

const getAll = async () => {
  const graders = await axios.get(baseUrl)
  return graders
}

export default { getAll }
