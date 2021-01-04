import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setNewReportAction } from 'Utilities/redux/newReportReducer'
import { attachRegistrations } from 'Utilities/inputParser'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from 'Utilities/inputParser'

const textAreaStyle = {
  padding: '20px'
}

export default () => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)
  const registrations = useSelector((state) => state.registrations.data)

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '') {
      dispatch(
        setNewReportAction({
          ...newReport,
          data: null,
          rawData
        })
      )
    } else if (registrations.length) {
      const data = parseCSV(rawData.trim())
      dispatch(
        setNewReportAction({
          ...newReport,
          data: attachRegistrations(data, registrations),
          rawData
        })
      )
    } else {
      const data = parseCSV(rawData.trim())
      dispatch(
        setNewReportAction({
          ...newReport,
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
        placeholder="Add the course completion information here, formatted as in the instructions above."
        rows={10}
        value={newReport.rawData}
        style={textAreaStyle}
      />
    </Form>
  )
}
