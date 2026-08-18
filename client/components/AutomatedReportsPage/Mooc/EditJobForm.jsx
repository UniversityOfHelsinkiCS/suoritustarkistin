import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as _ from 'lodash'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

import { editJobAction } from '@client/utils/redux/moocJobsReducer'
import { isValidJob, isValidSchedule } from '@shared/validators'

export default ({ job, close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const [data, setData] = useState(job || { active: false, useManualCompletionDate: false })

  if (!data.courseId || !courses) return null

  const course = courses.find((c) => c.id === data.courseId)

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(editJobAction(data))
    close()
  }

  return (
    <Box component="form" sx={{ p: 1 }}>
      <Stack spacing={2}>
        <TextField
          // The edit spec selects '[data-cy=edit-job-schedule] input', so unlike the
          // add form this data-cy belongs on the root
          data-cy="edit-job-schedule"
          required
          label="Cron schedule"
          placeholder="* * * * *"
          value={data.schedule || ''}
          onChange={(e) => setData({ ...data, schedule: e.target.value })}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {isValidSchedule(data.schedule) ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <CloseIcon fontSize="small" color="error" />
                  )}
                </InputAdornment>
              )
            }
          }}
        />
        <Autocomplete
          data-cy="edit-job-course"
          options={courses.map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`
          }))}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={
            courses
              .map((course) => ({
                key: course.id,
                value: course.id,
                text: `${course.name} (${course.courseCode})`
              }))
              .find((o) => o.value === data.courseId) || null
          }
          onChange={(e, option) => setData({ ...data, courseId: option ? option.value : null })}
          renderInput={(params) => <TextField {...params} required label="Course" />}
        />
        <Autocomplete
          data-cy="edit-job-grader"
          options={_.sortBy(course.graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={
            _.sortBy(course.graders, 'name')
              .map((grader) => ({ key: grader.id, value: grader.id, text: grader.name }))
              .find((o) => o.value === data.graderId) || null
          }
          onChange={(e, option) => setData({ ...data, graderId: option ? option.value : null })}
          renderInput={(params) => <TextField {...params} required label="Grader" />}
        />
        <TextField
          data-cy="edit-job-slug"
          label="Mooc API slug"
          value={data.slug || ''}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
        />
        <FormControlLabel
          control={
            <Checkbox
              data-cy="edit-job-active"
              checked={Boolean(data.active)}
              onChange={(e) => setData({ ...data, active: e.target.checked })}
            />
          }
          label="Active"
        />
        <FormControlLabel
          control={
            <Checkbox
              data-cy="edit-job-completion-date"
              checked={Boolean(data.useManualCompletionDate)}
              onChange={(e) => setData({ ...data, useManualCompletionDate: e.target.checked })}
            />
          }
          label="Use completion date, not registration attempt date"
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="error" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            data-cy="edit-job-confirm"
            variant="contained"
            color="success"
            disabled={!isValidJob(data)}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
