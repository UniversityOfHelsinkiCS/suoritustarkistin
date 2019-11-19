import SendButton from 'Components/NewReportPage/SendButton.js'
import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select, Input } from 'semantic-ui-react'
import { setNewReportAction } from 'Utilities/redux/newReportReducer'
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
      ? `${c.name} ((AY)${c.courseCode})`
      : `${c.name} (${c.courseCode})`,
    value: c.id
  }))

export default () => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)
  const user = useSelector((state) => state.user.data)
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)

  useEffect(() => {
    if (user.isAdmin) {
      dispatch(getAllCoursesAction())
      dispatch(getAllGradersAction())
    } else {
      dispatch(getUsersCoursesAction(user.id))
      dispatch(getUsersGradersAction(user.id))
    }
  }, [])

  const handleDateChange = (event) => {
    dispatch(setNewReportAction({ ...newReport, date: event.target.value }))
  }

  const handleGraderSelection = (e, data) => {
    dispatch(setNewReportAction({ ...newReport, graderEmployeeId: data.value }))
  }

  const handleCourseSelection = (e, data) => {
    const courseId = data.value
    const course = courses.find((course) => course.id === courseId)
    if (course.isMooc || course.autoSeparate) {
      dispatch(setNewReportAction({ ...newReport, courseId }))
      dispatch(getCoursesRegistrationsAction(courseId))
    } else {
      dispatch(setNewReportAction({ ...newReport, courseId }))
      dispatch(clearRegistrationsAction())
    }
  }

  return (
    <div>
      <Select
        className="input"
        data-cy="graderSelection"
        onChange={handleGraderSelection}
        value={newReport.graderEmployeeId}
        options={findGradersForSelection(graders)}
      />
      <Select
        className="input"
        data-cy="courseSelection"
        onChange={handleCourseSelection}
        placeholder="Valitse kurssi"
        value={newReport.courseId}
        options={formatCoursesForSelection(courses)}
      />
      <Input
        data-cy="dateField"
        type="text"
        onChange={handleDateChange}
        value={newReport.date}
        placeholder="p.k.vvvv"
      />
      <SendButton />
    </div>
  )
}
