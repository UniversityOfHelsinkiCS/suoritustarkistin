import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllJobsAction = () => {
  const route = '/jobs'
  const prefix = 'GET_ALL_JOBS'
  return callBuilder(route, prefix, 'get')
}

export const addJobAction = (data) => {
  const route = `/jobs`
  const prefix = 'ADD_JOB'
  return callBuilder(route, prefix, 'post', data)
}

export const editJobAction = (data) => {
  const route = `/jobs/${data.id}`
  const prefix = 'EDIT_JOB'
  return callBuilder(route, prefix, 'put', data)
}

export const deleteJobAction = (id) => {
  const route = `/jobs/${id}`
  const prefix = 'DELETE_JOB'
  return callBuilder(route, prefix, 'delete')
}

export const runJobAction = (id) => {
  const route = `/jobs/${id}`
  const prefix = 'RUN_JOB'
  return callBuilder(route, prefix, 'post')
}

export const sisRunJobAction = (id) => {
  const route = `/sis_jobs/${id}`
  const prefix = 'SIS_RUN_JOB'
  return callBuilder(route, prefix, 'post')
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  switch (action.type) {
    case 'GET_ALL_JOBS_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_ALL_JOBS_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_JOBS_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'ADD_JOB_SUCCESS':
      return {
        ...state,
        data: state.data.concat(action.response),
        pending: false,
        error: false
      }
    case 'ADD_JOB_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'ADD_JOB_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'EDIT_JOB_SUCCESS':
      return {
        ...state,
        data: state.data.map((j) =>
          j.id == action.response.id ? action.response : j
        ),
        pending: false,
        error: false
      }
    case 'EDIT_JOB_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'EDIT_JOB_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'DELETE_JOB_SUCCESS':
      return {
        ...state,
        data: state.data.filter((j) => j.id != action.response.id),
        pending: false,
        error: false
      }
    case 'DELETE_JOB_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'DELETE_JOB_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'SIS_RUN_JOB_SUCCESS':
      return {
        ...state,
        pending: false,
        error: false
      }
    case 'SIS_RUN_JOB_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'SIS_RUN_JOB_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    default:
      return state
  }
}
