import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { createUser, editUserAction, fetchUser } from '@client/utils/redux/usersReducer'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField
} from '@mui/material'
import { isValidEmailAddress } from '@shared/validators'
import * as _ from 'lodash'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const INITIAL_FORM_DATA = {
  email: '',
  uid: '',
  employeeId: '',
  name: '',
  isGrader: false,
  isAdmin: false,
  courses: [],
  errors: {}
}

export default ({ close, user }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })
  const [message, setMessage] = useState('')
  const [courseOptions, setCourseOptions] = useState([])
  const data = useSelector((state) => state.users)
  const courses = useSelector((state) => state.courses)
  const currentUser = useSelector((state) => state.user.data)

  const parseUser = (fetchedUser) => ({
    email: fetchedUser.primaryEmail || formData.email,
    uid: fetchedUser.eduPersonPrincipalName ? fetchedUser.eduPersonPrincipalName.split('@')[0] : formData.uid,
    employeeId: fetchedUser.employeeNumber || formData.employeeId,
    name:
      fetchedUser.firstNames || fetchedUser.lastName
        ? `${fetchedUser.firstNames} ${fetchedUser.lastName}`
        : formData.name,
    courses:
      fetchedUser.courses && fetchedUser.courses.length
        ? courseOptions.filter((option) => fetchedUser.courses.includes(option.coursecode)).map((option) => option.key)
        : formData.courses
  })

  useEffect(() => {
    if (data.error) setMessage(data.fetchedUser.error)
    if (!data.error && !data.pending) setFormData({ ...formData, ...parseUser(data.fetchedUser) })
  }, [data])

  useEffect(() => {
    if (!courses.data.length && !courses.pending) {
      dispatch(getAllCoursesAction())
      return () => {}
    }
    const options = _.sortBy(courses.data, 'name').map((course) => ({
      key: course.id,
      value: course.id,
      coursecode: course.courseCode,
      text: `${course.name} (${course.courseCode})`
    }))
    setCourseOptions(options)
    if (user && courses.data.length) {
      const userCourses = user.courses.map((course) => course.courseCode)
      setFormData({
        ...formData,
        ...user,
        courses: options.filter((option) => userCourses.includes(option.coursecode)).map((option) => option.key)
      })
    }
  }, [courses, user])

  if (!currentUser) return null

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  const validate = () =>
    formData.email && isValidEmailAddress(formData.email) && formData.employeeId && formData.uid && formData.name

  const handleSubmit = () => {
    if (user) dispatch(editUserAction(formData))
    else dispatch(createUser(formData))
    close()
  }

  const handleFetchUser = () => dispatch(fetchUser(formData))

  // Check if the user is trying to edit themselves
  // If so, disable editing uid and employee number as that would crash the login
  const editingCurrentUser = user && (currentUser.employeeId === user.employeeId || currentUser.uid === user.uid)

  return (
    <Box component="form" sx={{ p: 1, opacity: data.pending || courses.pending ? 0.5 : 1 }}>
      {message ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Failed to fetch user</AlertTitle>
          {message}
        </Alert>
      ) : null}

      <Stack spacing={2}>
        <TextField
          label="Email"
          placeholder="Email"
          value={formData.email}
          onChange={handleFieldChange}
          name="email"
          required
          error={Boolean(formData.email && !isValidEmailAddress(formData.email))}
          slotProps={{ htmlInput: { 'data-cy': 'add-email', name: 'email' } }}
        />
        <TextField
          label="AD account"
          placeholder="mluukkai"
          value={formData.uid}
          onChange={handleFieldChange}
          name="uid"
          required
          disabled={editingCurrentUser}
          slotProps={{ htmlInput: { 'data-cy': 'add-user-id', name: 'uid' } }}
        />
        <TextField
          label="Employee number"
          placeholder="Employee number"
          value={formData.employeeId}
          onChange={handleFieldChange}
          name="employeeId"
          required
          disabled={editingCurrentUser}
          slotProps={{ htmlInput: { 'data-cy': 'add-employee-number', name: 'employeeId' } }}
        />
        {editingCurrentUser && (
          <p style={{ color: 'gray', fontWeight: 'bold' }}>
            AD account and employee number of the currently logged in user cannot be changed
          </p>
        )}
        <TextField
          label="Full name"
          placeholder="Name"
          value={formData.name}
          onChange={handleFieldChange}
          name="name"
          required
          slotProps={{ htmlInput: { 'data-cy': 'add-user-name', name: 'name' } }}
        />
        <FormControlLabel
          control={
            <Checkbox
              data-cy="check-is-grader"
              checked={Boolean(formData.isGrader)}
              onChange={(e) => setFormData({ ...formData, isGrader: e.target.checked })}
            />
          }
          label="Is grader"
        />
        <FormControlLabel
          control={
            <Checkbox
              data-cy="check-is-admin"
              checked={Boolean(formData.isAdmin)}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
            />
          }
          label="Is admin"
        />
        <Autocomplete
          multiple
          data-cy="add-course"
          options={courseOptions}
          getOptionLabel={(option) => option.text}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          value={courseOptions.filter((o) => (formData.courses || []).includes(o.value))}
          onChange={(e, options) => setFormData({ ...formData, courses: options.map((o) => o.value) })}
          renderOption={(props, option) => (
            <li {...props} key={option.key} data-cy={`course-option-${option.coursecode}`}>
              {option.text}
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Add courses for user (optional)" />}
        />
        <Box>
          <Button
            data-cy="add-user-fetch"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleFetchUser}
            disabled={!(formData.uid || formData.email || formData.employeeId)}
          >
            Fetch user details
          </Button>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="error" onClick={close}>
            Cancel
          </Button>
          <Button
            data-cy="add-user-confirm"
            variant="contained"
            color="success"
            disabled={!validate() || data.pending}
            onClick={handleSubmit}
          >
            {user ? 'Edit user' : 'Add user'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
