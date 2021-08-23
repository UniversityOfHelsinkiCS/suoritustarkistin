import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Checkbox, Select } from 'semantic-ui-react'
import * as _ from 'lodash'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import SendButton from 'Components/NewReportPage/SendButton.js'
import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import {
  getCoursesRegistrationsAction,
  clearRegistrationsAction
} from 'Utilities/redux/registrationsReducer'
import {
  getAllGradersAction,
  getUsersGradersAction
} from 'Utilities/redux/gradersReducer'
import {
  getAllCoursesAction,
  getUsersCoursesAction
} from 'Utilities/redux/coursesReducer'

const formatGradersForSelection = (data) => {
  const graders = data.map((g) => ({ key: g.employeeId, text: g.name, value: g.employeeId }))
  if (graders) return _.sortBy(graders, ['text'])
  return []

}

const formatCoursesForSelection = (data) => {
  const courses = data.map((c) => ({
    key: c.id,
    text: `${c.name} (${c.courseCode})`,
    value: c.id
  }))
  if (courses) return _.sortBy(courses, ['text'])
  return []
}

export default () => {
  const dispatch = useDispatch()
  const [showingDate, setShowingDate] = useState()
  const [defaultGrade, setDefaultGrade] = useState(false)
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const user = useSelector((state) => state.user.data)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)

  useEffect(() => {
    if (user.adminMode) {
      dispatch(getAllCoursesAction())
      dispatch(getAllGradersAction())
    } else {
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersGradersAction(user.id))
    }
  }, [user])


  // Select course from first row if a valid course code is provided
  useEffect(() => {
    if (!newRawEntries.data || !newRawEntries.data.length) return
    const { course: courseCode } = newRawEntries.data[0]
    const course = courses.find((c) => c.courseCode.toLowerCase() === courseCode.toLowerCase())
    if (!course) return
    if (course.id === newRawEntries.courseId) return

    handleCourseSelection(null, { value: course.id })
  }, [newRawEntries])

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
    if (course.autoSeparate) {
      dispatch(setNewRawEntriesAction({ ...newRawEntries, courseId }))
      dispatch(getCoursesRegistrationsAction(courseId))
    } else {
      dispatch(setNewRawEntriesAction({ ...newRawEntries, courseId }))
      dispatch(clearRegistrationsAction())
    }
  }

  const handleDefaultGradeSelection = () => {
    const newDefaultGrade = !defaultGrade
    setDefaultGrade(newDefaultGrade)
    dispatch(setNewRawEntriesAction({ ...newRawEntries, defaultGrade: newDefaultGrade }))
  }

  return (
    <>
      <div style={{ marginBlock: '10px', marginBottom: '10px', display: 'flex' }}>
        <Select
          className="input"
          data-cy="grader-selection"
          placeholder="Choose grader"
          onChange={handleGraderSelection}
          value={newRawEntries.graderId}
          options={formatGradersForSelection(graders)}
        />
        <Select
          className="input"
          data-cy="course-selection"
          onChange={handleCourseSelection}
          placeholder="Choose course"
          value={newRawEntries.courseId}
          options={formatCoursesForSelection(courses)}
        />
        <DatePicker
          id="date-picker"
          className="date-picker"
          style={{ height: "20px" }}
          dateFormat="dd.MM.yyyy"
          placeholderText="Set date for completions"
          selected={showingDate}
          onChange={(date) => handleDateSelection(date)}
        />
        <span style={{ paddingTop: "0.7em", paddingLeft: "1em" }}>
          <Checkbox
            data-cy="default-grade-election"
            onChange={handleDefaultGradeSelection}
            checked={defaultGrade}
            label="Give all students grade 'Hyv.'"
          />
        </span>
        <SendButton />
      </div>
      <span style={{ paddingTop: "1.3em", width: "40em", height: "3em" }}>
        Remember to report completions for the correct academic year (1.8. – 31.7.)
      </span>
    </>
  )
}