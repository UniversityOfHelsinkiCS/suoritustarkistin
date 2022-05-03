import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Form, TextArea } from 'semantic-ui-react'
import { setNewRawEntriesAction, resetNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { isKandiExtraCourse } from 'Root/utils/common'

const textAreaStyle = {
  padding: '20px'
}

export default ({ kandi, parseCSV }) => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)
  const getKandiExtras = () => courses.filter((course) => isKandiExtraCourse(course))

  const handleDataChange = (event) => {
    let rawData = event.target.value
    if (rawData === '')
      return dispatch(resetNewRawEntriesAction())

    if (rawData.includes("'")) {
      rawData.split("\n").forEach((row) => {
        if (row[0]=== "'") {
          const newRow = row.substring(1)
          rawData = rawData.replace(row, newRow)
        }
      })
    }

    const defaultCourses = kandi ? getKandiExtras() : newRawEntries.defaultCourse
    const data = parseCSV(rawData.trim(), defaultCourses)

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
