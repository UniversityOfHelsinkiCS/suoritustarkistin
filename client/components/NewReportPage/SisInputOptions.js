import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select, Input } from 'semantic-ui-react'
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

const findGradersForSelection = (data) =>
  data.map((g) => ({ key: g.employeeId, text: g.name, value: g.employeeId }))

const formatCoursesForSelection = (data) =>
  data.map((c) => ({
    key: c.id,
    text: c.autoSeparate
      ? `${c.name} (${c.courseCode} + AY${c.courseCode})`
      : `${c.name} (${c.courseCode})`,
    value: c.id
  }))

export default () => {
  const dispatch = useDispatch()
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

  const handleDateChange = (event) => {
    dispatch(setNewRawEntriesAction({ ...newRawEntries, date: event.target.value }))
  }

  const handleGraderSelection = (e, data) => {
    dispatch(setNewRawEntriesAction({ ...newRawEntries, graderEmployeeId: data.value }))
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
    <div style={{ marginBlock: '10px', marginBottom: '50px' }}>
      <Select
        className="input"
        data-cy="graderSelection"
        placeholder="Choose grader"
        onChange={handleGraderSelection}
        value={newRawEntries.graderEmployeeId}
        options={findGradersForSelection(graders)}
      />
      <Select
        className="input"
        data-cy="courseSelection"
        onChange={handleCourseSelection}
        placeholder="Choose course"
        value={newRawEntries.courseId}
        options={formatCoursesForSelection(courses)}
      />
      <Input
        data-cy="dateField"
        type="text"
        onChange={handleDateChange}
        value={newRawEntries.date}
        placeholder="dd.mm.yyyy"
      />
      <SisSendButton />
    </div>
  )
}