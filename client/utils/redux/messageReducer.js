export const setMessageAction = (message) => {
  return { type: 'SET_MESSAGE', payload: message }
}

export const clearMessageAction = () => {
  return { type: 'CLEAR_MESSAGE' }
}

export default (state = null, action) => {
  switch (action.type) {
    case 'SET_MESSAGE':
      return action.payload
    case 'CLEAR_MESSAGE':
      return null
    case 'POST_REPORT_SUCCESS':
      return {
        header: 'Report sent!',
        content:
          'Course completions have now been sent for reporting. You can see the created report on the "View reports" -page',
        type: 'positive'
      }
    case 'POST_REPORT_FAILURE':
      return {
        header: 'Sending the report failed!',
        content:
          'Sending the course completions failed. If the error persists, please contact grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'ADD_COURSE_SUCCESS':
      return {
        header: `Course ${action.response.name} has been created.`,
        content: 'You can now add new completions for the course.',
        type: 'positive'
      }
    case 'ADD_COURSE_FAILURE':
      return {
        header: 'Creating the course failed!',
        content:
          'Course creation failed. If the error persists, please contact grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'EDIT_COURSE_SUCCESS':
      return {
        header: `${action.response.name} has been successfully modified!`,
        content: 'New completions will be added with the modified course information.',
        type: 'positive'
      }
    case 'EDIT_COURSE_FAILURE':
      return {
        header: 'Modifying the course failed.',
        content:
          'Course modification has failed. If the error persists, please contact grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'DELETE_COURSE_SUCCESS':
      return {
        header: `Course has been successfully deleted.`,
        content: 'The course has been deleted and no new completions can be added.',
        type: 'positive'
      }
    default:
      return state
  }
}
