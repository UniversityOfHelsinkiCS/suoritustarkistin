import React from 'react'
import { Select } from 'semantic-ui-react'

const formatGradersForSelection = data => data.map(g => ({ key: g.id, text: g.name, value: g.id }))
const formatCoursesForSelection = data => data.map(c => ({ key: c.id, text: c.courseCode, value: c.id }))

export default ({
  setReport, report, graders, courses,
}) => {
  const handleTokenChange = (event) => {
    setReport({ ...report, token: event.target.value })
  }

  const handleDateChange = (event) => {
    setReport({ ...report, date: event.target.value })
  }

  const handleGraderSelection = (e, data) => {
    setReport({ ...report, graderId: data.value })
  }

  const handleCourseSelection = (e, data) => {
    setReport({ ...report, courseId: data.value })
  }

  const validateAndSend = () => {
    console.log('check report state has everything, send')
    if (
      report.courseId
      && report.graderId
      && 'validate token'
      && 'data is not null'
      && 'validate date'
    ) {
      // send to server
    }
  }

  return (
    <div>
      <Select
        onChange={handleGraderSelection}
        placeholder="Valitse arvostelija"
        options={formatGradersForSelection(graders)}
      />
      <Select
        onChange={handleCourseSelection}
        placeholder="Valitse kurssi"
        options={formatCoursesForSelection(courses)}
      />
      <div className="ui input">
        <input type="text" onChange={handleDateChange} value={report.date} placeholder="p.k.vvvv" />
      </div>
      <div className="ui input">
        <input
          type="text"
          onChange={handleTokenChange}
          value={report.token}
          placeholder="Arvostelijatunnus"
        />
      </div>
      <button onClick={validateAndSend} className="right floated disabled negative ui button">
        Lähetä raportti
      </button>
      <button onClick={validateAndSend} className="right floated positive ui button">
        Luo raportti
      </button>
    </div>
  )
}
