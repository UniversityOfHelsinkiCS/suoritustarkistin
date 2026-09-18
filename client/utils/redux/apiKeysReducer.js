import callBuilder from '../apiConnection'

export const getApiKeysAction = () => {
  const route = '/api_keys'
  const prefix = 'GET_API_KEYS'
  return callBuilder(route, prefix, 'get')
}

export const revokeApiKeyAction = (id) => {
  const route = `/api_keys/${id}`
  const prefix = 'REVOKE_API_KEY'
  return callBuilder(route, prefix, 'delete')
}

// Creating a key has no action on purpose -- the response carries the plaintext token, and
// ApiKeyForm explains why that must not reach the store. It refetches through getApiKeysAction.
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_API_KEYS_SUCCESS':
      return { ...state, data: action.response, error: false }
    case 'REVOKE_API_KEY_SUCCESS':
      return {
        ...state,
        data: state.data.map((key) => (key.id === action.response.id ? action.response : key)),
        error: false
      }
    case 'GET_API_KEYS_FAILURE':
    case 'REVOKE_API_KEY_FAILURE':
      return { ...state, error: true }
    default:
      return state
  }
}
