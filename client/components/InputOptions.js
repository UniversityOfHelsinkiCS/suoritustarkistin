import SendButton from 'Components/SendButton.js'
import React from 'react'
import { Select, Input } from 'semantic-ui-react'

const findGradersForSelection = (data) =>
  data.map((g) => ({ key: g.employeeId, text: g.name, value: g.employeeId }))

const formatCoursesForSelection = (data) =>
  data.map((c) => ({
    key: c.id,
    text: `${c.name} (${c.courseCode})`,
    value: c.id
  }))

export default ({
  setReport,
  report,
  graders,
  courses,
  setMessage,
  setTextData
}) => {
  const handleTokenChange = (event) => {
    setReport({ ...report, token: event.target.value })
  }

  const handleDateChange = (event) => {
    setReport({ ...report, date: event.target.value })
  }

  const handleGraderSelection = (e, data) => {
    setReport({ ...report, graderEmployeeId: data.value })
  }

  const handleCourseSelection = (e, data) => {
    setReport({ ...report, courseId: data.value })
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
      <Input
        data-cy="tokenField"
        type="text"
        onChange={handleTokenChange}
        value={report.token || ''}
        placeholder="Arvostelijatunnus"
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
