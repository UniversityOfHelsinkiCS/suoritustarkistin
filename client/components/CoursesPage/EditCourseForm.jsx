import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as _ from 'lodash'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import RefreshIcon from '@mui/icons-material/Refresh'
import { editCourseAction, getResponsiblesAction, resetResponsibles } from '@client/utils/redux/coursesReducer'
import { isValidCourse } from '@shared/validators'
import Help from '@client/components/CoursesPage/Help'
import { validityAdornment } from '@client/components/CoursesPage/NewCourseForm'

export default ({ course, close: closeModal }) => {
  const dispatch = useDispatch()
  const allGraders = useSelector((state) => state.graders.data)
  const courseData = useSelector((state) => state.courses)
  const [data, setData] = useState({ ...course, graders: course.graders.map((g) => g.id) })

  useEffect(() => {
    if (courseData.responsibles && !courseData.pending) {
      const responsibleUids = Object.keys(courseData.responsibles)
        .filter((r) => courseData.responsibles[r].person.eduPersonPrincipalName)
        .map((r) => courseData.responsibles[r].person.eduPersonPrincipalName.split('@')[0])
      const newGraders = allGraders.filter((g) => responsibleUids.includes(g.uid)).map(({ id }) => id)
      const graders = _.uniq(data.graders.concat(newGraders))
      setData({ ...data, graders })
    }
  }, [courseData])

  const close = () => {
    dispatch(resetResponsibles())
    closeModal()
  }

  if (!allGraders) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(editCourseAction(data))
    close()
  }

  const graderOptions = _.sortBy(allGraders, 'name').map((grader) => ({
    key: grader.id,
    value: grader.id,
    text: grader.name
  }))

  return (
    <Box component="form" sx={{ p: 1 }}>
      <Stack spacing={2}>
        <TextField
          required
          label="Course name"
          placeholder="Basics of creating a course"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          slotProps={{ input: validityAdornment(Boolean(data.name)) }}
        />
        <Autocomplete
          multiple
          data-cy="edit-course-grader"
          options={graderOptions}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={graderOptions.filter((o) => (data.graders || []).includes(o.value))}
          onChange={(e, options) => setData({ ...data, graders: options.map((o) => o.value) })}
          renderOption={(props, option) => (
            <li {...props} key={option.key} data-cy={`grader-option-${option.text}`}>
              {option.text}
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Graders" required />}
        />
        <Box>
          <Button
            data-cy="fetch-graders"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => dispatch(getResponsiblesAction(course.courseCode))}
          >
            Fetch course graders
          </Button>
        </Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(data.useAsExtra)}
              onChange={(e) => setData({ ...data, useAsExtra: e.target.checked })}
            />
          }
          label={
            <>
              Use as erilliskirjaus
              <Help text='Select this only if course is used as "erilliskirjaus" together with bachelors thesis' />
            </>
          }
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(data.isNewMooc)}
              onChange={(e) => setData({ ...data, isNewMooc: e.target.checked })}
            />
          }
          label={
            <>
              Use new mooc platform
              <Help text="Select if course is a mooc course running on courses.mooc.fi" />
            </>
          }
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="error" onClick={() => close()}>
            Cancel
          </Button>
          <Button
            data-cy="edit-course-confirm"
            variant="contained"
            color="success"
            disabled={!isValidCourse(data)}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
