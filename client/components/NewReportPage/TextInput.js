import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, TextArea } from 'semantic-ui-react'
import { setNewRawEntriesAction, resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { parseCSV, parseKandiCSV, parseExtraCSV } from 'Utilities/inputParser'
import { isKandiExtraCourse } from 'Root/utils/common'

const textAreaStyle = {
  padding: '20px'
}


const defineParser = (kandi, extra) => {
  if (kandi) return parseKandiCSV
  if (extra) return parseExtraCSV
  return parseCSV
} 

export default ({ kandi, extra }) => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)
  const CSVParser = defineParser(kandi, extra)
  const getKandiExtras = () => courses.filter((course) => isKandiExtraCourse(course))

  const handleDataChange = (event) => {
    const rawData = event.target.value
    if (rawData === '')
      return dispatch(resetNewRawEntriesAction())

    const defaultCourses = kandi ? getKandiExtras() : newRawEntries.defaultCourse
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
