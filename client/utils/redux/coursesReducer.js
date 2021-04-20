import callBuilder from '../apiConnection'
/**
 * Actions and reducers are in the same file for readability
 */

export const getAllCoursesAction = () => {
  const route = '/courses'
  const prefix = 'GET_ALL_COURSES'
  return callBuilder(route, prefix, 'get')
}

export const getUsersCoursesAction = (id) => {
  const route = `/users/${id}/courses`
  const prefix = 'GET_USERS_COURSES'
  return callBuilder(route, prefix, 'get')
}

export const addCourseAction = (data) => {
  const route = `/courses`
  const prefix = 'ADD_COURSE'
  return callBuilder(route, prefix, 'post', data)
}

export const getResponsiblesAction = (courseCode) => {
  const route = `/courses/${courseCode}/responsibles`
  const prefix = 'GET_RESPONSIBLES'
  return callBuilder(route, prefix, 'get')
}

export const editCourseAction = (data) => {
  const route = `/courses/${data.id}`
  const prefix = 'EDIT_COURSE'
  return callBuilder(route, prefix, 'put', data)
}

export const confirmDeletionAction = (id) => {
  const route = `/courses/${id}/confirm_deletion`
  const prefix = 'CONFIRM_DELETION'
  return callBuilder(route, prefix, 'get')
}

export const deleteCourseAction = (id) => {
  const route = `/courses/${id}`
  const prefix = 'DELETE_COURSE'
  return callBuilder(route, prefix, 'delete')
}

export const resetResponsibles = () => ({
  type: 'RESPONSIBLES_RESET'
})

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [], unsent: 0, pending: false }, action) => {
  switch (action.type) {
    case 'GET_ALL_COURSES_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_ALL_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_ALL_COURSES_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'GET_USERS_COURSES_SUCCESS':
      return {
        ...state,
        data: action.response,
        pending: false,
        error: false
      }
    case 'GET_USERS_COURSES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'GET_USERS_COURSES_FAILURE':
      return {
        ...state,
        data: [],
        pending: false,
        error: true
      }
    case 'ADD_COURSE_SUCCESS':
      return {
        ...state,
        data: state.data.concat(action.response),
        responsibles: null,
        pending: false,
        error: false
      }
    case 'ADD_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'ADD_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'EDIT_COURSE_SUCCESS':
      return {
        ...state,
        data: state.data.map((c) =>
          c.id == action.response[0].id ? action.response[0] : c
        ),
        responsibles: null,
        pending: false,
        error: false
      }
    case 'EDIT_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'EDIT_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'CONFIRM_DELETION_SUCCESS':
      return {
        ...state,
        unsent: action.response.unsent,
        pending: false,
        error: false
      }
    case 'CONFIRM_DELETION_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'CONFIRM_DELETION_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'DELETE_COURSE_SUCCESS':
      return {
        ...state,
        data: state.data.filter((c) => c.id != action.response.id),
        pending: false,
        error: false
      }
    case 'DELETE_COURSE_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'DELETE_COURSE_FAILURE':
      return {
        ...state,
        pending: false,
        error: true
      }
    case 'GET_RESPONSIBLES_SUCCESS':
      return {
        ...state,
        responsibles: action.response,
        pending: false,
        error: false
      }
    case 'GET_RESPONSIBLES_ATTEMPT':
      return {
        ...state,
        pending: true,
        error: false
      }
    case 'RESPONSIBLES_RESET':
      return { ...state, responsibles: null }
    default:
      return state
  }
}
