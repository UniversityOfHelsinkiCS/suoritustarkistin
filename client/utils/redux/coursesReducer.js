import callBuilder from '../apiConnection'
//import { useDispatch } from 'react-redux'
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

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = { data: [] }, action) => {
  //const dispatch = useDispatch()

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
      //dispatch(getAllCoursesAction)
      return state
    default:
      return state
  }
}
