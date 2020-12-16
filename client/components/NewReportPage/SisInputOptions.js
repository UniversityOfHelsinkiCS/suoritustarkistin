import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select, Input } from 'semantic-ui-react'
import SisSendButton from 'Components/NewReportPage/SisSendButton.js'
import { sisSetNewReportAction } from 'Utilities/redux/sisNewReportReducer'
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
  const sisNewReport = useSelector((state) => state.sisNewReport)
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
    dispatch(sisSetNewReportAction({ ...sisNewReport, date: event.target.value }))
  }

  const handleGraderSelection = (e, data) => {
    dispatch(sisSetNewReportAction({ ...sisNewReport, graderEmployeeId: data.value }))
  }

  const handleCourseSelection = (e, data) => {
    const courseId = data.value
    const course = courses.find((course) => course.id === courseId)
    if (course.isMooc || course.autoSeparate) {
      dispatch(sisSetNewReportAction({ ...sisNewReport, courseId }))
      dispatch(getCoursesRegistrationsAction(courseId))
    } else {
      dispatch(sisSetNewReportAction({ ...sisNewReport, courseId }))
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
        value={sisNewReport.graderEmployeeId}
        options={findGradersForSelection(graders)}
      />
      <Select
        className="input"
        data-cy="courseSelection"
        onChange={handleCourseSelection}
        placeholder="Choose course"
        value={sisNewReport.courseId}
        options={formatCoursesForSelection(courses)}
      />
      <Input
        data-cy="dateField"
        type="text"
        onChange={handleDateChange}
        value={sisNewReport.date}
        placeholder="dd.mm.yyyy"
      />
      <SisSendButton />
    </div>
  )
}