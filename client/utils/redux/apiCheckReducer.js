import callBuilder from '../apiConnection'

export const checkEduWeb = (courseCode) => {
  const route = `/apicheck/eduweb/${courseCode}`
  const prefix = 'CHECK_EDUWEB_API'
  return callBuilder(route, prefix, 'get')
}

export const checkMooc = (courseCode) => {
  const route = `/apicheck/mooc/${courseCode}`
  const prefix = 'CHECK_MOOC_API'
  return callBuilder(route, prefix, 'get')
}

export const checkNewMooc = (courseCode) => {
  const route =  `apicheck/newmooc/${courseCode}`
  const prefix = 'CHECK_NEW_MOOC_API'
  return callBuilder(route, prefix, 'get')
}

export default (state = {}, action) => {
  switch (action.type) {
    case 'CHECK_EDUWEB_API_SUCCESS':
      return {
        ...state,
        eduweb: action.response,
        pending: false,
        error: false
      }
    case 'CHECK_EDUWEB_API_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'CHECK_EDUWEB_API_FAILURE':
      return {
        ...state,
        eduweb: action.response,
        pending: false,
        error: true
      }
    case 'CHECK_MOOC_API_SUCCESS':
      return {
        ...state,
        mooc: action.response,
        pending: false,
        error: false
      }
    case 'CHECK_MOOC_API_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'CHECK_MOOC_API_FAILURE':
      return {
        ...state,
        mooc: [],
        pending: false,
        error: true
      }
      case 'CHECK_NEW_MOOC_API_SUCCESS':
        return {
          ...state,
          newMooc: action.response,
          pending: false,
          error: false
        }
      case 'CHECK_NEW_MOOC_API_ATTEMPT':
        return {
          ...state,
          pending: true,
          error: false
        }
      case 'CHECK_NEW_MOOC_API_FAILURE':
        return {
          ...state,
          newMooc: [],
          pending: false,
          error: true
        }

    default:
      return state
  }
}
