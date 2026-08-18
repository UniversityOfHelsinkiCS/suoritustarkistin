import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, TextField } from '@mui/material'
import { setNewRawEntriesAction, resetNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import { isKandiExtraCourse } from '@shared/common'

export default ({ kandi, parseCSV }) => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)
  const getKandiExtras = () => courses.filter((course) => isKandiExtraCourse(course))

  const getGraderId = ({ graderId, uid }) => {
    const { employeeId } = graders.find((grader) => grader.uid === uid) || {}

    return employeeId || graderId || ''
  }

  const handleDataChange = (event) => {
    let rawData = event.target.value
    if (rawData === '') {
      const { graderId, courseId, defaultCourse } = newRawEntries
      // The kandi tab always reports the thesis course, so clearing must not unpin it.
      return dispatch(resetNewRawEntriesAction({ graderId, keep: kandi ? { courseId, defaultCourse } : {} }))
    }

    if (rawData.includes("'")) {
      rawData.split('\n').forEach((row) => {
        if (row[0] === "'") {
          const newRow = row.substring(1)
          rawData = rawData.replace(row, newRow)
        }
      })
    }

    const defaultCourses = kandi ? getKandiExtras() : newRawEntries.defaultCourse
    const parsed = parseCSV(rawData.trim(), defaultCourses)

    const data = parsed.map((entry) => ({ ...entry, graderId: getGraderId(entry) }))

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
    <Box sx={{ position: 'relative' }}>
      <TextField
        multiline
        fullWidth
        minRows={10}
        onChange={handleDataChange}
        placeholder="Add the course completion information here, formatted as in the instructions above."
        value={newRawEntries.rawData}
        disabled={newRawEntries.sending}
        // The specs type into this directly, so data-cy has to land on the textarea
        // rather than the TextField root.
        slotProps={{ htmlInput: { 'data-cy': 'paste-field' } }}
      />
    </Box>
  )
}
