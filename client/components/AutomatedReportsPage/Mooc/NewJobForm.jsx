import { addJobAction } from '@client/utils/redux/moocJobsReducer'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { Autocomplete, Box, Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField } from '@mui/material'
import { isValidJob, isValidSchedule } from '@shared/validators'
import * as _ from 'lodash'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default ({ close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState({ active: false, useManualCompletionDate: false })

  if (!courses || !graders) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addJobAction(data))
    setData({ active: true })
    close()
  }

  return (
    <Box component="form" sx={{ p: 1 }}>
      <Stack spacing={2}>
        <TextField
          required
          label="Cron schedule"
          placeholder="* * * * *"
          value={data.schedule || ''}
          onChange={(e) => setData({ ...data, schedule: e.target.value })}
          slotProps={{
            htmlInput: { 'data-cy': 'add-job-schedule' },
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
          data-cy="add-job-course"
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
          data-cy="add-job-grader"
          options={_.sortBy(graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={
            _.sortBy(graders, 'name')
              .map((grader) => ({ key: grader.id, value: grader.id, text: grader.name }))
              .find((o) => o.value === data.graderId) || null
          }
          onChange={(e, option) => setData({ ...data, graderId: option ? option.value : null })}
          renderInput={(params) => <TextField {...params} required label="Grader" />}
        />
        <TextField
          data-cy="add-job-slug"
          label="Mooc API slug"
          value={data.slug || ''}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
        />
        <FormControlLabel
          control={
            <Checkbox
              data-cy="add-job-active"
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
            data-cy="add-job-confirm"
            variant="contained"
            color="success"
            disabled={!isValidJob(data)}
            onClick={handleSubmit}
          >
            Add Cronjob
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
