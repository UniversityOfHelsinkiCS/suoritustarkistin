import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Checkbox, Select, Form, Button } from 'semantic-ui-react'
import * as _ from 'lodash'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { sendNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'

import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import {
  getAllGradersAction,
  getUsersGradersAction
} from 'Utilities/redux/gradersReducer'
import {
  getAllCoursesAction,
  getUsersCoursesAction
} from 'Utilities/redux/coursesReducer'
import { isOneOfKandiCourses, isRegularExtraCourse } from 'Utilities/common'
import { areValidNewRawEntries } from 'Root/utils/validators'
import ImportStudents from './ImportStudents'

const styles = {
  sendButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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


const formatCoursesForSelection = (data) => {
  const courses = data
    .map((c) => ({
      key: c.id,
      text: `${c.name} (${c.courseCode})`,
      value: c.id
    }))
  if (courses) return _.sortBy(courses, ['text'])
  return []
}

const formatCoursesForKandi = (courses) => courses
  .map((c) => {
    if (!c.useAsExtra) return {
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

  const defaultGrade = rawEntries.defaultGrade
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
  const courseOptions = defineCourseOptions(courses, kandi, extra)

  const sendRawEntries = async () => await dispatch(sendNewRawEntriesAction(parseRawEntries(newRawEntries)))

  useEffect(() => {
    if (user.adminMode) {
      dispatch(getAllCoursesAction())
      dispatch(getAllGradersAction())
    } else {
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersGradersAction(user.id))
    }
  }, [user])

  useEffect(() => {
    if (areValidNewRawEntries(parseRawEntries(newRawEntries)))
      setIsValid(true)
    else setIsValid(false)
  }, [newRawEntries])

  useEffect(() => {
    if (kandi && courses) {
      const { courseCode, id: courseId } = courses.find(({ courseCode }) => courseCode === 'TKT20013')
      const data = {
        ...newRawEntries,
        defaultCourse: courseCode,
        data: null,
        courseId
      }
      if (graders && graders.length === 1)
        data.graderId = graders[0].employeeId
      dispatch(setNewRawEntriesAction(data))
    }
  }, [courses, kandi, graders])

  const handleGraderSelection = (e, data) => {
    dispatch(setNewRawEntriesAction({ ...newRawEntries, graderId: data.value }))
  }

  const handleDateSelection = (date) => {
    setShowingDate(date)
    // Send the date as a mid-day object to avoid one day off -errors
    let newDay = null
    if (date) {
      newDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6)
    }
    dispatch(setNewRawEntriesAction({ ...newRawEntries, date: newDay ? newDay : new Date() }))
  }

  const handleCourseSelection = (e, { value: courseId }) => {
    const course = courses.find((course) => course.id === courseId)
    if (!course) return
    dispatch(setNewRawEntriesAction({
      ...newRawEntries,
      defaultCourse: course.courseCode,
      data: parseCSV(newRawEntries.rawData.trim(), course.courseCode),
      courseId
    }))
  }

  const handleDefaultGradeSelection = () => {
    const newDefaultGrade = !defaultGrade
    setDefaultGrade(newDefaultGrade)
    dispatch(setNewRawEntriesAction({ ...newRawEntries, defaultGrade: newDefaultGrade }))
  }

  const importRows = (rows) => {
    const rowsAsCSV = Object.keys(rows).map((studentNumner) => `${studentNumner};${rows[studentNumner].grade}`)
    const data = parseCSV(rowsAsCSV.join('\n'), newRawEntries.defaultCourse)
    dispatch(
      setNewRawEntriesAction({
        ...newRawEntries,
        data,
        rawData: rowsAsCSV.join('\n')
      })
    )
  }

  return (
    <>
      <ImportStudents
        isOpen={importIsOpen}
        setIsOpen={setImportIsOpen}
        importRows={importRows} />
      <Form style={styles.form}>
        <Form.Group widths='equal'>
          <Form.Field
            control={Select}
            search
            className="input"
            data-cy="grader-selection"
            placeholder="Choose grader"
            label="Choose grader"
            onChange={handleGraderSelection}
            value={newRawEntries.graderId}
            options={formatGradersForSelection(graders)}
          />
          <Form.Field
            control={Select}
            search
            className="input"
            data-cy="course-selection"
            onChange={handleCourseSelection}
            placeholder="Choose course"
            label="Choose course"
            value={newRawEntries.courseId}
            options={courseOptions}
          />
          <Form.Field>
            <label>Set date for completions</label>
            <DatePicker
              id="date-picker"
              className="date-picker"
              style={{ height: "20px", width: '100%' }}
              dateFormat="dd.MM.yyyy"
              selected={showingDate}
              onChange={(date) => handleDateSelection(date)}
            />
          </Form.Field>
          {!kandi
            ? <>
              <Form.Field
                className="default-grade"
                control={Checkbox}
                data-cy="default-grade-election"
                onChange={handleDefaultGradeSelection}
                checked={defaultGrade}
                label="Give all students grade 'Hyv.'"
              />
            </>
            : null}
        </Form.Group>
      </Form>
      <div style={styles.sendButton}>
        <Button
          disabled={!newRawEntries.defaultCourse}
          color="primary"
          onClick={() => setImportIsOpen(true)}
        >
          Import students
        </Button>
        <Button
          disabled={newRawEntries.sending || !newRawEntries.data || !isValid}
          data-cy="confirm-sending-button"
          color="green"
          onClick={sendRawEntries}
        >
          Create report
        </Button>
      </div>
      <div style={styles.info}>
        Remember to report completions for the correct academic year (1.8. – 31.7.)
      </div>
    </>
  )
}