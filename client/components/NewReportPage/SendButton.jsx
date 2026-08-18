import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import * as _ from 'lodash'

import { sendNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import { areValidNewRawEntries } from '@shared/validators'

const parseRawEntries = (rawEntries) => {
  if (!rawEntries.data) return rawEntries

  const { defaultGrade } = rawEntries
  return {
    ...rawEntries,
    data: rawEntries.data.map((row) => {
      if (row.registration && !row.grade) {
        return {
          ...row,
          grade: defaultGrade ? 'Hyv.' : null,
          studentId: row.registration.onro,
          registration: undefined
        }
      }
      if (!row.grade && defaultGrade) {
        return {
          ...row,
          grade: 'Hyv.'
        }
      }
      return row
    }),
    sending: undefined,
    rawData: undefined
  }
}

const parseCourseName = (newRawEntries, defaultCourse, courses) => {
  if (!newRawEntries.data || !courses) return null

  let rowCourses = []
  newRawEntries.data.forEach((row) => {
    const course = courses.find((c) => c.courseCode === row.course)
    if (course) rowCourses = [...rowCourses, course]
    else if (defaultCourse) rowCourses = [...rowCourses, defaultCourse]
  })

  const amounts = _.countBy(rowCourses, 'courseCode')

  if (rowCourses.length) {
    return (
      <>
        {_.uniq(rowCourses).map((c) => (
          <p key={c.name}>{`${amounts[c.courseCode]} x ${c.name} (${c.courseCode})`}</p>
        ))}
      </>
    )
  }

  return <span>No courses chosen yet</span>
}

export default () => {
  const [showForm, setShowForm] = useState(false)
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)

  const closeModal = () => setShowForm(false)

  if (!courses) return null

  const defaultCourse = courses.find((c) => c.id === newRawEntries.courseId)

  const sendingDisabled = newRawEntries.sending || !areValidNewRawEntries(parseRawEntries(newRawEntries))

  // Semantic's Popup took a `disabled` prop to suppress itself; MUI shows a tooltip
  // whenever the title is non-empty, so the same condition is inverted here.
  const showTooltip =
    Boolean(newRawEntries.data) &&
    !areValidNewRawEntries(parseRawEntries(newRawEntries) || (newRawEntries.data && newRawEntries.data.length <= 100))

  const sendRawEntries = async () => {
    await dispatch(sendNewRawEntriesAction(parseRawEntries(newRawEntries)))
    closeModal()
  }

  return (
    <>
      <Dialog open={showForm} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', padding: '2em' }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Following completion(s) will be reported:
          </Typography>
          {newRawEntries.sending && <Alert severity="info">Sending the report</Alert>}
          <Typography component="div" sx={{ mt: 2 }}>
            {parseCourseName(newRawEntries, defaultCourse, courses)}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            variant="contained"
            disabled={newRawEntries.sending}
            data-cy="confirm-sending-button"
            color="success"
            onClick={sendRawEntries}
          >
            Create report
          </Button>
          <Button
            variant="outlined"
            disabled={newRawEntries.sending}
            onClick={closeModal}
            data-cy="cancel-sending-button"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Tooltip
        title={
          showTooltip
            ? newRawEntries.data && newRawEntries.data.length > 100
              ? 'Currently single report can contain max 100 completions'
              : 'Report contains validation errors, see table below.'
            : ''
        }
      >
        {/* A disabled button fires no pointer events, so the tooltip needs a live wrapper */}
        <Box component="span" sx={{ display: 'inline-block' }}>
          <Button
            variant="contained"
            color="success"
            data-cy="create-report-button"
            onClick={() => setShowForm(true)}
            disabled={sendingDisabled}
          >
            Create report
          </Button>
        </Box>
      </Tooltip>
    </>
  )
}
