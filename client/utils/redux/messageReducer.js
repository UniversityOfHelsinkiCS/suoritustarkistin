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
        header: 'Raportti lähetetty!',
        content:
          'Kurssisuoritukset on lähetetty eteenpäin kirjattavaksi. Näet luodun raportin View reports-sivulta.',
        type: 'positive'
      }
    case 'POST_REPORT_FAILURE':
      return {
        header: 'Raportin lähetys epäonnistui!',
        content:
          'Kurssisuoritusten lähettäminen epäonnistui. Jos vika jatkuu, ota yhteyttä grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'ADD_COURSE_SUCCESS':
      return {
        header: `Kurssi ${action.response.name} luotu.`,
        content: 'Kurssille voi nyt kirjata uusia suorituksia.',
        type: 'positive'
      }
    case 'ADD_COURSE_FAILURE':
      return {
        header: 'Kurssin luonti epäonnistui!',
        content:
          'Kurssin luonti epäonnistui. Jos vika jatkuu, ota yhteyttä grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'EDIT_COURSE_SUCCESS':
      return {
        header: `Kurssin ${action.response.name} muokkaus onnistui.`,
        content: 'Kurssin tulevat suoritukset kirjataan uusilla tiedoilla.',
        type: 'positive'
      }
    case 'EDIT_COURSE_FAILURE':
      return {
        header: 'Kurssin muokkaus epäonnistui.',
        content:
          'Kurssin muokkaus epäonnistui. Jos vika jatkuu, ota yhteyttä grp-toska@cs.helsinki.fi.',
        type: 'negative'
      }
    case 'DELETE_COURSE_SUCCESS':
      return {
        header: `Kurssin poisto onnistui.`,
        content: 'Kurssi on poistettu eikä sille voi enää merkitä suorituksia.',
        type: 'positive'
      }
    default:
      return state
  }
}
