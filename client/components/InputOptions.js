import SendButton from 'Components/SendButton.js'
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setNewReportAction } from 'Utilities/redux/newReportReducer'
import {
  getCoursesRegistrationsAction,
  clearRegistrationsAction
} from 'Utilities/redux/registrationsReducer'
import { Select, Input } from 'semantic-ui-react'

const findGradersForSelection = (data) =>
  data.map((g) => ({ key: g.employeeId, text: g.name, value: g.employeeId }))

const formatCoursesForSelection = (data) =>
  data.map((c) => ({
    key: c.id,
    text: `${c.name} (${c.courseCode})`,
    value: c.id
  }))

const isOpenUniCourse = (course) => {
  return course.courseCode.substring(0, 2) === 'AY'
}

export default ({
  setReport,
  report,
  graders,
  courses,
  setMessage,
  setTextData
}) => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)

  const handleDateChange = (event) => {
    dispatch(setNewReportAction({ ...newReport, date: event.target.value }))
  }

  const handleGraderSelection = (e, data) => {
    dispatch(setNewReportAction({ ...newReport, graderEmployeeId: data.value }))
  }

  const handleCourseSelection = (e, data) => {
    const courseId = data.value
    const course = courses.find((course) => course.id === courseId)
    if (isOpenUniCourse(course)) {
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
        value={report.graderEmployeeId}
        options={findGradersForSelection(graders)}
      />
      <Select
        className="input"
        data-cy="courseSelection"
        onChange={handleCourseSelection}
        placeholder="Valitse kurssi"
        options={formatCoursesForSelection(courses)}
      />
      <Input
        data-cy="dateField"
        type="text"
        onChange={handleDateChange}
        value={report.date}
        placeholder="p.k.vvvv"
      />
      <SendButton
        report={report}
        setReport={setReport}
        setMessage={setMessage}
        setTextData={setTextData}
      />
    </div>
  )
}
