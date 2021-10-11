import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, TextArea } from 'semantic-ui-react'
import { setNewRawEntriesAction, resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { parseCSV, parseKandiCSV } from 'Utilities/inputParser'

const textAreaStyle = {
  padding: '20px'
}


export default ({ kandi }) => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const CSVParser = kandi ? parseKandiCSV : parseCSV
  const courses = useSelector((state) => state.courses.data)
  const getExtras = () => courses.filter((c) => c.courseUnitId)

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '')
      return dispatch(resetNewRawEntriesAction())

    const defaultCourses = kandi ? getExtras() : newRawEntries.defaultCourse
    const data = CSVParser(rawData.trim(), defaultCourses)

    dispatch(
      setNewRawEntriesAction({
        ...newRawEntries,
        data,
        rawData,
        isKandi: kandi
      })
    )
  }

  return (
    <Form loading={newRawEntries.sending}>
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
