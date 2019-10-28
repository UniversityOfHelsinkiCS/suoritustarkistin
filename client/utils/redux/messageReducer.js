export const setMessageAction = (message) => {
  return { type: 'SET_MESSAGE', payload: message }
}

export const clearMessageAction = () => {
  return { type: 'CLEAR_MESSAGE' }
}

// Reducer
// You can include more app wide actions such as "selected: []" into the state
export default (state = null, action) => {
  switch (action.type) {
    case 'SET_MESSAGE':
      return action.payload
    case 'CLEAR_MESSAGE':
      return null
    case 'POST_REPORT_SUCCESS':
      return {
        header: 'Raportti lähetetty!',
        content: 'Kurssisuoritukset on lähetetty eteenpäin kirjattavaksi.',
        type: 'positive'
      }
    case 'POST_REPORT_FAILURE':
      return {
        header: 'Raportin lähetys epäonnistui!',
        content:
          'Kurssisuoritusten lähettäminen epäonnistui. Jos vika jatkuu, ota yhteyttä grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    default:
      return state
  }
}
