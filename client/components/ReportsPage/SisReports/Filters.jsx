import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'

import { toggleFilterAction, setFilterAction } from '@client/utils/redux/sisReportsReducer'
import { getAllCoursesAction, getUsersCoursesAction } from '@client/utils/redux/coursesReducer'
import { formatCoursesForSelection } from '../../NewReportPage/InputOptions'

const STATE_OPTIONS = [
  {
    text: 'All reports',
    value: 'ALL',
    key: 0
  },
  {
    text: 'Missing from Sisu',
    value: 'NOT_REGISTERED',
    key: 1
  },
  {
    text: 'Partly registered to Sisu',
    value: 'PARTLY_REGISTERED',
    key: 2
  },
  {
    text: 'Fully registered to Sisu',
    value: 'REGISTERED',
    key: 3
  }
]

export default ({ reduxKey, action }) => {
  const [mounted, setMounted] = useState(false)
  const filters = useSelector((state) => state.sisReports.filters)
  const user = useSelector((state) => state.user.data)
  const courses = useSelector((state) => state.courses.data)
  const dispatch = useDispatch()
  const { offset, limit } = useSelector((state) => state.sisReports[reduxKey])

  const courseOptions = formatCoursesForSelection(courses)
  courseOptions.unshift({ key: '', text: 'All courses', value: '' })

  const toggle = (name) => dispatch(toggleFilterAction(name))
  const set = (name, value) => dispatch(setFilterAction(name, value))
  const debouncedSet = debounce(set, 250)

  useEffect(() => {
    // Prevent fetch when filters are initially rendered
    if (mounted) dispatch(action({ offset, limit, filters }))
    setMounted(true)
  }, [filters])

  useEffect(() => {
    // oxlint-disable-next-line no-unused-expressions
    user.adminMode ? dispatch(getAllCoursesAction()) : dispatch(getUsersCoursesAction(user.id))
  }, [user, dispatch])

  return (
    <>
      <Typography variant="h6" component="h3" gutterBottom>
        Include reports with:
      </Typography>
      <Box component="form">
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={<Switch checked={Boolean(filters.errors)} onChange={() => toggle('errors')} />}
            label="Contains errors"
          />
          <FormControlLabel
            control={<Switch checked={Boolean(filters.noEnrollment)} onChange={() => toggle('noEnrollment')} />}
            label="Missing enrollments"
          />
          <FormControlLabel
            control={<Switch checked={Boolean(filters.notSent)} onChange={() => toggle('notSent')} />}
            label="Not sent to Sisu"
          />
          <TextField
            select
            size="small"
            label="Attainment status"
            sx={{ minWidth: '16rem' }}
            value={filters.status || 'ALL'}
            onChange={(e) => set('status', e.target.value)}
          >
            {STATE_OPTIONS.map((o) => (
              <MenuItem key={o.key} value={o.value} data-cy={`status-option-${o.value}`}>
                {o.text}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
          <TextField
            data-cy="student-filter"
            size="small"
            label="Filter by student number"
            defaultValue={filters.search}
            onChange={(event) => debouncedSet('student', event.target.value)}
          />
          <Autocomplete
            data-cy="course-filter"
            size="small"
            // 'All courses' is a real option, so clearing to null would leave no value
            disableClearable
            sx={{ minWidth: '24rem' }}
            options={courseOptions}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            value={courseOptions.find((o) => o.value === filters.course) || courseOptions[0]}
            onChange={(_, option) => set('course', option ? option.value : '')}
            renderInput={(params) => <TextField {...params} label="Filter by course" />}
          />
        </Stack>
      </Box>
    </>
  )
}
