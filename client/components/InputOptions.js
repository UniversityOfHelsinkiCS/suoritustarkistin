import React, { useState } from 'react'
import { Select, Button } from 'semantic-ui-react'
import reportService from '../services/reports'

const { parseAndValidateReport } = require('../utils/reportCsvToJson')

const formatGradersForSelection = data => data.map(g => ({ key: g.id, text: g.name, value: g.id }))
const formatCoursesForSelection = data => data.map(c => ({ key: c.id, text: c.courseCode, value: c.id }))

export default ({
  setMessages, messages, setReport, report, graders, courses,
}) => {
  const [readyToSend, setReadyToSend] = useState(false)

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

  const validateAndShowReport = () => {
    console.log(report)

    setMessages([])
    let errors = []
    if (!report.courseId) errors = errors.concat([{ type: 'error', content: ' Valitse kurssi.' }])
    if (!report.graderId) errors = errors.concat([{ type: 'error', content: ' Valitse arvostelija.' }])
    if (!report.date) errors = errors.concat([{ type: 'error', content: ' Merkitse arvostelupäivämäärä.' }])
    if (!report.data) errors = errors.concat([{ type: 'error', content: ' Lähetä tiedosto.' }])
    if (!report.token) errors = errors.concat([{ type: 'error', content: ' Lisää arvostelijatunnuksesi.' }])

    setMessages(errors)
    if (errors.length === 0) {
      // validoi data, eka virherivi errorsiin
      // kasaa raportti jsoniksi
    }

    setMessages(errors)
    if (errors.length === 0) {
      setReadyToSend(true)
    }
  }

  const sendReport = async () => {
    try {
      const response = await reportService.createNew(report.token, report)
      setReport({
        ...report,
        token: null,
        data: null,
      })
      return response
    } catch (e) {
      alert(`Lähetys epäonnistui:\n${e}`)
    }
    setReadyToSend(false)
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
          value={report.token || ''}
          placeholder="Arvostelijatunnus"
        />
      </div>
      <Button
        onClick={sendReport}
        disabled={!readyToSend}
        className="right floated negative ui button"
      >
        Lähetä raportti
      </Button>
      <Button onClick={validateAndShowReport} className="right floated positive ui button">
        Luo raportti
      </Button>
    </div>
  )
}
