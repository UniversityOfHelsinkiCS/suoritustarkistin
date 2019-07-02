import React from 'react'
import { Button } from 'semantic-ui-react'
import reportService from '../services/reports'
import { isValidReport } from 'Root/utils/validators'

export default ({ report, setReport, setMessage }) => {
  const sendReport = async () => {
    try {
      const token = report.token
      setReport({
        ...report,
        token: null
      })
      const response = await reportService.createNew(token, report)
      setReport({
        ...report,
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
    <Button
      onClick={sendReport}
      disabled={!isValidReport(report)}
      className="right floated negative ui button"
      content="Lähetä raportti"
    />
  )
}
