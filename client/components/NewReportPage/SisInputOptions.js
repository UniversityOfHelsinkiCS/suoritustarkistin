import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select } from 'semantic-ui-react'
import * as _ from 'lodash'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import SisSendButton from 'Components/NewReportPage/SisSendButton.js'
import { setNewRawEntriesAction } from 'Utilities/redux/sisNewRawEntriesReducer'
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
    text: c.autoSeparate
      ? `${c.name} (${c.courseCode} + AY${c.courseCode})`
      : `${c.name} (${c.courseCode})`,
    value: c.id
  }))
  if (courses) return _.sortBy(courses, ['text'])
  return []
}

export default () => {
  const dispatch = useDispatch()
  const [showingDate, setShowingDate] = useState(new Date())
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

  const handleGraderSelection = (e, data) => {
    dispatch(setNewRawEntriesAction({ ...newRawEntries, graderId: data.value }))
  }

  const handleDateSelection = (date) => {
    setShowingDate(date)
    dispatch(setNewRawEntriesAction({ ...newRawEntries, date }))
  }

  const handleCourseSelection = (e, data) => {
    const courseId = data.value
    const course = courses.find((course) => course.id === courseId)
    if (course.isMooc || course.autoSeparate) {
      dispatch(setNewRawEntriesAction({ ...newRawEntries, courseId }))
      dispatch(getCoursesRegistrationsAction(courseId))
    } else {
      dispatch(setNewRawEntriesAction({ ...newRawEntries, courseId }))
      dispatch(clearRegistrationsAction())
    }
  }

  return (
    <div style={{ marginBlock: '10px', marginBottom: '10px', display: 'flex' }}>
      <Select
        className="input"
        data-cy="sisGraderSelection"
        placeholder="Choose grader"
        onChange={handleGraderSelection}
        value={newRawEntries.graderId}
        options={formatGradersForSelection(graders)}
      />
      <Select
        className="input"
        data-cy="sisCourseSelection"
        onChange={handleCourseSelection}
        placeholder="Choose course"
        value={newRawEntries.courseId}
        options={formatCoursesForSelection(courses)}
      />
      <DatePicker
        id="sisDatePicker"
        className="date-picker"
        style={{ height: "10px"}}
        dateFormat="dd.MM.yyyy"
        placeholderText="Set date for completions"
        selected={showingDate}
        onChange={(date) => handleDateSelection(date)}
      />
      <span style={{ paddingLeft: "1em", width: "20em", height: "3em" }}>
        Remember to report completions for the correct academic year (1.8. – 31.7.)
      </span>
      <SisSendButton />
    </div>
  )
}