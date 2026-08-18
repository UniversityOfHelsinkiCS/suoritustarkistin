import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, Stack, TextField } from '@mui/material'
import * as _ from 'lodash'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { setNewRawEntriesAction, sendNewRawEntriesAction } from '@client/utils/redux/newRawEntriesReducer'
import { getAllGradersAction, getUsersGradersAction } from '@client/utils/redux/gradersReducer'
import { getAllCoursesAction, getUsersCoursesAction } from '@client/utils/redux/coursesReducer'
import { isOneOfKandiCourses, isRegularExtraCourse } from '@client/utils/common'
import { areValidNewRawEntries } from '@shared/validators'
import { isKandiExtraCourse, isThesisCourse } from '@shared/common'
import ImportStudents from './ImportStudents'

const styles = {
  sendButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem'
  },
  info: {
    marginTop: '1rem'
  },
  form: {
    marginTop: '1rem'
  }
}

const formatGradersForSelection = (data) => {
  const graders = data.map((g) => ({ key: g.employeeId, text: g.name, value: g.employeeId }))
  if (graders) return _.sortBy(graders, ['text'])
  return []
}

export const formatCoursesForSelection = (data) => {
  const courses = data.map((c) => ({
    key: c.id,
    text: `${c.name} (${c.courseCode})`,
    value: c.id
  }))
  if (courses) return _.sortBy(courses, ['text'])
  return []
}

const filterAYCodes = (courses) => courses.filter((course) => !course.courseCode.startsWith('AY'))

const formatCoursesForKandi = (courses) =>
  courses
    .map((c) => {
      if (!c.useAsExtra)
        return {
          key: c.id,
          text: `${c.name} (${c.courseCode})`,
          value: c.id
        }
      return {
        key: c.id,
        text: `${c.name} (${c.courseCode})`,
        value: c.id,
        disabled: true
      }
    })
    .sort((a, b) => (a.disabled || false) - (b.disabled || false))

const defineCourseOptions = (courses, kandi, extra) => {
  if (kandi) return formatCoursesForKandi(courses.filter((course) => isOneOfKandiCourses(course)))
  if (extra) return formatCoursesForSelection(courses.filter((course) => isRegularExtraCourse(course)))
  return formatCoursesForSelection(courses.filter(({ useAsExtra }) => !useAsExtra))
}

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

export default ({ kandi, extra, parseCSV }) => {
  const dispatch = useDispatch()
  const [showingDate, setShowingDate] = useState()
  const [importIsOpen, setImportIsOpen] = useState(false)
  const [defaultGrade, setDefaultGrade] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const user = useSelector((state) => state.user.data)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)
  const courseOptions = defineCourseOptions(filterAYCodes(courses), kandi, extra)
  const getKandiExtras = () => courses.filter((course) => isKandiExtraCourse(course))

  const sendRawEntries = async () => {
    const acualDataNewRawEntries = {
      ...newRawEntries,
      importStudentsAttainments: undefined,
      importStudents: undefined
    }

    await dispatch(sendNewRawEntriesAction(parseRawEntries(acualDataNewRawEntries)))
  }

  useEffect(() => {
    if (user.adminMode) {
      dispatch(getAllCoursesAction())
      dispatch(getAllGradersAction())
    } else {
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersGradersAction(user.id))
    }
  }, [user, dispatch])

  useEffect(() => {
    if (areValidNewRawEntries(parseRawEntries(newRawEntries))) setIsValid(true)
    else setIsValid(false)
  }, [newRawEntries])

  useEffect(() => {
    if (!kandi || !courses) return

    const thesisCourse = courses.find(isThesisCourse)
    const data = {
      ...newRawEntries,
      defaultCourse: thesisCourse.courseCode,
      courseId: thesisCourse.id
    }
    if (graders && graders.length === 1) data.graderId = graders[0].employeeId
    dispatch(setNewRawEntriesAction(data))
  }, [courses, kandi, graders, dispatch])

  const handleGraderSelection = (e, data) => {
    dispatch(setNewRawEntriesAction({ ...newRawEntries, graderId: data.value }))
  }

  const handleDateSelection = (date) => {
    setShowingDate(date)
    // Send the date as a mid-day object to avoid one day off -errors
    let newDay = null
    if (date && date.toDateString() !== new Date().toDateString())
      newDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6)

    dispatch(setNewRawEntriesAction({ ...newRawEntries, date: newDay || new Date() }))
  }

  const handleCourseSelection = (e, { value: courseId }) => {
    const course = courses.find((course) => course.id === courseId)
    if (!course) return
    dispatch(
      setNewRawEntriesAction({
        ...newRawEntries,
        defaultCourse: course.courseCode,
        data: parseCSV(newRawEntries.rawData.trim(), course.courseCode),
        courseId
      })
    )
  }

  const handleDefaultGradeSelection = () => {
    const newDefaultGrade = !defaultGrade
    setDefaultGrade(newDefaultGrade)
    dispatch(setNewRawEntriesAction({ ...newRawEntries, defaultGrade: newDefaultGrade }))
  }

  const importRows = (rows) => {
    const defaultCourses = kandi ? getKandiExtras() : newRawEntries.defaultCourse
    const rowsAsCSV = Object.keys(rows).map((studentNumner) => {
      const { grade, date } = rows[studentNumner]
      if (date) return `${studentNumner};${grade};;;${date}`
      return `${studentNumner};${grade}`
    })
    const data = parseCSV(rowsAsCSV.join('\n'), defaultCourses)
    dispatch(
      setNewRawEntriesAction({
        ...newRawEntries,
        data,
        rawData: rowsAsCSV.join('\n')
      })
    )
  }

  const graderOptions = formatGradersForSelection(graders)

  return (
    <>
      <ImportStudents isOpen={importIsOpen} setIsOpen={setImportIsOpen} importRows={importRows} />
      <Box sx={styles.form}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <Autocomplete
            fullWidth
            autoHighlight
            blurOnSelect
            data-cy="grader-selection"
            options={graderOptions}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            value={graderOptions.find((o) => o.value === newRawEntries.graderId) || null}
            onChange={(e, option) => handleGraderSelection(e, { value: option ? option.value : undefined })}
            renderInput={(params) => <TextField {...params} label="Choose grader" />}
          />
          <Autocomplete
            fullWidth
            autoHighlight
            blurOnSelect
            data-cy="course-selection"
            disabled={kandi}
            options={courseOptions}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            value={courseOptions.find((o) => o.value === newRawEntries.courseId) || null}
            onChange={(e, option) => handleCourseSelection(e, { value: option ? option.value : undefined })}
            renderInput={(params) => <TextField {...params} label="Choose course" />}
          />
          <DatePicker
            id="date-picker"
            autoComplete="off"
            dateFormat="dd.MM.yyyy"
            selected={showingDate}
            onChange={(date) => handleDateSelection(date)}
            // Rendering through a TextField is what keeps the picker looking like the
            // other inputs; the old .date-picker class hand-copied Semantic's input styling.
            customInput={<TextField fullWidth label="Set date for completions" />}
          />
          {!kandi ? (
            <FormControlLabel
              sx={{ whiteSpace: 'nowrap', mt: 1 }}
              control={
                <Checkbox
                  data-cy="default-grade-election"
                  onChange={handleDefaultGradeSelection}
                  checked={defaultGrade}
                />
              }
              label="Give all students grade 'Hyv.'"
            />
          ) : null}
        </Stack>
      </Box>
      <div style={styles.sendButton}>
        {
          !extra ? (
            <Button variant="contained" disabled={!newRawEntries.defaultCourse} onClick={() => setImportIsOpen(true)}>
              Import students
            </Button>
          ) : (
            <span />
          ) // Add empty element to align send button to right with justify-content space-between
        }
        <Button
          variant="contained"
          color="success"
          disabled={newRawEntries.sending || !newRawEntries.data || !isValid}
          data-cy="confirm-sending-button"
          onClick={sendRawEntries}
        >
          Create report
        </Button>
      </div>
      <div style={styles.info}>Remember to report completions for the correct academic year (1.8. – 31.7.)</div>
      {newRawEntries.data && newRawEntries.data.some((entry) => entry.duplicate) && (
        <Alert severity="error">There are duplicate entries.</Alert>
      )}
    </>
  )
}
