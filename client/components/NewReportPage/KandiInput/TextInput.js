import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Loader, Message, TextArea } from 'semantic-ui-react'
import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { parseKandiCSV } from 'Utilities/inputParser'

const textAreaStyle = {
  padding: '20px'
}

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)

  const getExtras = () => courses.filter((c) => c.courseUnitId)

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
      const data = parseKandiCSV(rawData.trim(), getExtras())
      dispatch(
        setNewRawEntriesAction({
          ...newRawEntries,
          data,
          isKandi: true,
          rawData
        })
      )
    }
  }

  return (
    <Form>
      <Loader size='big' active={newRawEntries.sending} />
      {newRawEntries.data && newRawEntries.data.length > 100 ? <Message color="orange">
        Currently single report can contain max 100 completions
      </Message> : null}
      <TextArea
        data-cy="paste-field"
        onChange={handleDataChange}
        placeholder="Add the course completion information here, formatted as in the instructions above."
        rows={10}
        value={newRawEntries.rawData}
        style={textAreaStyle}
      />
    </Form>
  )
}
