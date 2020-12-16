import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { sisSetNewReportAction } from 'Utilities/redux/sisNewReportReducer'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from 'Utilities/inputParser'

const textAreaStyle = {
  padding: '20px'
}

export default () => {
  const dispatch = useDispatch()
  const sisNewReport = useSelector((state) => state.sisNewReport)

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '') {
      dispatch(
        sisSetNewReportAction({
          ...sisNewReport,
          data: null,
          rawData
        })
      )
    } else {
      const data = parseCSV(rawData.trim())
      dispatch(
        sisSetNewReportAction({
          ...sisNewReport,
          data,
          rawData
        })
      )
    }
  }

  return (
    <Form>
      <TextArea
        data-cy="pastefield"
        onChange={handleDataChange}
        placeholder="Liitä suoritustiedot tähän ylläolevan ohjeen mukaan formatoituna."
        rows={10}
        value={sisNewReport.rawData}
        style={textAreaStyle}
      />
    </Form>
  )
}
