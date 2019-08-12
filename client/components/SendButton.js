import React from 'react'
import { Button } from 'semantic-ui-react'
import { isValidReport } from 'Root/utils/validators'
import reportService from '../services/reports'

export default ({ report, setReport, setMessage, setTextData }) => {
  const sendReport = async () => {
    try {
      const forwardReport = { ...report }
      setReport({
        ...report,
        data: null
      })
      const response = await reportService.createNew(forwardReport)
      setTextData('')
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
      data-cy="sendButton"
      onClick={sendReport}
      disabled={!isValidReport(report)}
      className="right floated negative ui button"
      content="Lähetä raportti"
    />
  )
}
