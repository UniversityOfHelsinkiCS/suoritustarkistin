import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setNewRawEntriesAction } from 'Utilities/redux/sisNewRawEntriesReducer'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from 'Utilities/inputParser'

const textAreaStyle = {
  padding: '20px'
}

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '') {
      dispatch(
        setNewRawEntriesAction({
          ...newRawEntries,
          data: null,
          rawData
        })
      )
    } else {
      const data = parseCSV(rawData.trim())
      dispatch(
        setNewRawEntriesAction({
          ...newRawEntries,
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
        placeholder="Add the course completion information, formatted as in the instructions above."
        rows={10}
        value={newRawEntries.rawData}
        style={textAreaStyle}
      />
    </Form>
  )
}
