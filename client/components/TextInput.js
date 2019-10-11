import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setNewReportAction } from 'Utilities/redux/newReportReducer'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from 'Utilities/inputParser'

export default ({ textData, setTextData }) => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '') {
      dispatch(
        setNewReportAction({
          ...newReport,
          data: null
        })
      )
    } else {
      const data = parseCSV(rawData.trim())
      dispatch(
        setNewReportAction({
          ...newReport,
          data
        })
      )
    }
    setTextData(rawData)
  }
  const textAreaStyle = {
    padding: '20px'
  }

  return (
    <Form>
      <TextArea
        data-cy="pastefield"
        onChange={handleDataChange}
        placeholder="Liitä suoritustiedot tähän ylläolevan ohjeen mukaan formatoituna."
        rows={10}
        value={textData}
        style={textAreaStyle}
      />
    </Form>
  )
}
