import React, { useState } from 'react'
import { Select, Button } from 'semantic-ui-react'
import reportService from '../services/reports'
import { isValidReport } from 'Root/utils/validators'

const formatGradersForSelection = (data) =>
  data.map((g) => ({ key: g.id, text: g.name, value: g.id }))
const formatCoursesForSelection = (data) =>
  data.map((c) => ({
    key: c.id,
    text: `${c.name} (${c.courseCode})`,
    value: c.id
  }))

export default ({ setReport, report, graders, courses, setMessage }) => {
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

  const sendReport = async () => {
    try {
      const response = await reportService.createNew(report.token, report)
      setReport({
        ...report,
        token: null,
        data: null
      })
      setMessage({
        header: 'Raportti lähetetty!',
        content: 'Kurssisuoritukset on lähetetty eteenpäin kirjattavaksi.'
      })
      return response
    } catch (e) {
      alert(`Lähetys epäonnistui:\n${e}`)
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
        <input
          type="text"
          onChange={handleDateChange}
          value={report.date}
          placeholder="p.k.vvvv"
        />
      </div>
      <div className="ui input">
        <input
          type="text"
          onChange={handleTokenChange}
          value={report.token || ''}
          placeholder="Arvostelijatunnus"
        />
      </div>
      <Button
        onClick={sendReport}
        disabled={!isValidReport(report)}
        className="right floated negative ui button"
      >
        Lähetä raportti
      </Button>
    </div>
  )
}
