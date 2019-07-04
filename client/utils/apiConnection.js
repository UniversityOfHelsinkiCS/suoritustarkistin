import axios from 'axios'

/**
 * ApiConnection simplifies redux usage
 */

const getAxios = axios.create({ baseURL: '/api' })

const callApi = async (url, method = 'get', data) => {
  const options = { headers: {} }
  return getAxios[method](url, data, options)
}

export default (route, prefix, method = 'get', data, query) => (
  {
    type: `${prefix}_ATTEMPT`,
    requestSettings: {
      route,
      method,
      data,
      prefix,
      query
    }
  }
)

/**
 * This is a redux middleware used for tracking api calls
 */

export const handleRequest = (store) => (next) => async (action) => {
  next(action)
  const { requestSettings } = action
  if (requestSettings) {
    const {
      route, method, data, prefix, query
    } = requestSettings
    try {
      const res = await callApi(route, method, data)
      store.dispatch({ type: `${prefix}_SUCCESS`, response: res.data, query })
    } catch (err) {
      store.dispatch({ type: `${prefix}_FAILURE`, response: err, query })
    }
  }
}
