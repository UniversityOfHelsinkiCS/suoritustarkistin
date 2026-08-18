import Help from '@client/components/CoursesPage/Help'
import { addCourseAction, getResponsiblesAction, resetResponsibles } from '@client/utils/redux/coursesReducer'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Autocomplete, Box, Button, Checkbox, FormControlLabel, InputAdornment, Stack, TextField } from '@mui/material'
import { gradeScales } from '@shared/common'
import { isValidCourse, isValidCourseCode, isValidCreditAmount, isValidLanguage } from '@shared/validators'
import * as _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export const validityAdornment = (valid) => ({
  endAdornment: (
    <InputAdornment position="end">
      {valid ? <CheckIcon fontSize="small" color="success" /> : <CloseIcon fontSize="small" color="error" />}
    </InputAdornment>
  )
})

export default ({ close: closeModal }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const courseData = useSelector((state) => state.courses)
  const [data, setData] = useState({ graders: [], useAsExtra: false })

  useEffect(() => {
    if (courseData.responsibles && !courseData.pending) {
      const responsibleUids = Object.keys(courseData.responsibles)
        .filter((r) => courseData.responsibles[r].person.eduPersonPrincipalName)
        .map((r) => courseData.responsibles[r].person.eduPersonPrincipalName.split('@')[0])
      const newGraders = graders.filter((g) => responsibleUids.includes(g.uid)).map(({ id }) => id)
      const updatedGraders = _.uniq(data.graders.concat(newGraders))
      setData({ ...data, graders: updatedGraders })
    }
  }, [courseData])

  const close = () => {
    dispatch(resetResponsibles())
    closeModal()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addCourseAction(data))
    close()
  }

  const graderOptions = _.sortBy(graders, 'name').map((grader) => ({
    key: grader.id,
    value: grader.id,
    text: grader.name
  }))

  return (
    <Box component="form" sx={{ p: 1 }}>
      <Stack spacing={2}>
        <TextField
          data-cy="add-course-name"
          required
          label="Course name"
          placeholder="Basics of creating a course"
          value={data.name || ''}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          slotProps={{ input: validityAdornment(Boolean(data.name)) }}
        />
        <TextField
          data-cy="add-course-code"
          required
          label="Course code"
          placeholder="TKT00000"
          value={data.courseCode || ''}
          onChange={(e) => setData({ ...data, courseCode: e.target.value })}
          slotProps={{ input: validityAdornment(isValidCourseCode(data.courseCode)) }}
        />
        <TextField
          data-cy="add-course-language"
          required
          label="Language"
          placeholder="fi"
          value={data.language || ''}
          onChange={(e) => setData({ ...data, language: e.target.value })}
          slotProps={{ input: validityAdornment(isValidLanguage(data.language)) }}
        />
        <TextField
          data-cy="add-course-credits"
          required
          label="Credit amount"
          placeholder="5,0"
          value={data.credits || ''}
          onChange={(e) => setData({ ...data, credits: e.target.value })}
          slotProps={{ input: validityAdornment(isValidCreditAmount(data.credits)) }}
        />
        <Autocomplete
          data-cy="add-course-grade-scale"
          options={gradeScales}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={gradeScales.find((g) => g.value === data.gradeScale) || null}
          onChange={(e, option) => setData({ ...data, gradeScale: option ? option.value : undefined })}
          renderOption={(props, option) => (
            <li {...props} key={option.key} data-cy={`grade-scale-option-${option.value}`}>
              {option.text}
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Grade scale" />}
        />
        <Autocomplete
          multiple
          data-cy="add-course-grader"
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
          renderInput={(params) => <TextField {...params} label="Grader" />}
        />
        <Box>
          <Button
            data-cy="fetch-graders"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={!isValidCourseCode(data.courseCode)}
            onClick={() => dispatch(getResponsiblesAction(data.courseCode))}
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
            data-cy="add-course-confirm"
            variant="contained"
            color="success"
            disabled={!isValidCourse(data)}
            onClick={handleSubmit}
          >
            Add Course
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
