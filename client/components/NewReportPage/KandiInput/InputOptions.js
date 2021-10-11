import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Select } from 'semantic-ui-react'
import * as _ from 'lodash'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import SendButton from 'Components/NewReportPage/SendButton.js'
import { setNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
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

const formatCoursesForSelection = (data) => data
  .filter(({ courseCode, courseUnitId }) => courseCode === 'TKT20013' || courseUnitId)
  .map((c) => {
    if (!c.courseUnitId) return {
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


export default () => {
  const dispatch = useDispatch()
  const [showingDate, setShowingDate] = useState()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const user = useSelector((state) => state.user.data)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)
  const courseOptions = formatCoursesForSelection(courses)

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
    const { courseCode, id: courseId } = courses.find(({ courseCode }) => courseCode === 'TKT20013')
    dispatch(setNewRawEntriesAction({
      ...newRawEntries,
      defaultCourse: courseCode,
      data: null,
      courseId
    }))
  }, [courses])

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

  return (
    <>
      <div style={{ marginBlock: '10px', marginBottom: '10px', display: 'flex' }}>
        <Select
          search
          className="input"
          data-cy="grader-selection"
          placeholder="Choose grader"
          onChange={handleGraderSelection}
          value={newRawEntries.graderId}
          options={formatGradersForSelection(graders)}
        />
        <Select
          search
          className="input"
          data-cy="course-selection"
          placeholder="Choose course"
          value={newRawEntries.courseId}
          options={courseOptions}
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
        <SendButton />
      </div>
      <span style={{ paddingTop: "1.3em", width: "40em", height: "3em" }}>
        Remember to report completions for the correct academic year (1.8. – 31.7.)
      </span>
    </>
  )
}