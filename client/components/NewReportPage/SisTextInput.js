import React from 'react'
import { Loader } from 'semantic-ui-react'

import { useSelector, useDispatch } from 'react-redux'
import { setNewRawEntriesAction } from 'Utilities/redux/sisNewRawEntriesReducer'
import { TextArea, Form } from 'semantic-ui-react'
import { parseCSV } from 'Utilities/sisInputParser'

const textAreaStyle = {
  padding: '20px'
}

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)

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
      const data = parseCSV(rawData.trim(), newRawEntries, courses)
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
      <Loader size='big' active={newRawEntries.sending} />
      <TextArea
        data-cy="pastefield"
        onChange={handleDataChange}
        placeholder="Add the course completion information here, formatted as in the instructions above."
        rows={10}
        value={newRawEntries.rawData}
        style={textAreaStyle}
      />
    </Form>
  )
}
