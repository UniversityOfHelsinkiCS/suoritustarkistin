import React from 'react'
import { Button } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendNewReportAction } from 'Utilities/redux/newReportReducer'
import { isValidReport } from 'Root/utils/validators'

const parseReport = (report) => {
  if (!report.data) return report

  return {
    ...report,
    data: report.data.map((row) => {
      if (row.registration) {
        return {
          ...row,
          studentId: row.registration.onro,
          registration: undefined
        }
      }
      return row
    })
  }
}

export default ({ setMessage, setTextData }) => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)

  const sendReport = async () => {
    try {
      dispatch(sendNewReportAction(parseReport(newReport)))
      setTextData('')
      setMessage({
        header: 'Raportti lähetetty!',
        content: 'Kurssisuoritukset on lähetetty eteenpäin kirjattavaksi.'
      })
    } catch (e) {
      alert(`Lähetys epäonnistui:\n${e}`)
    }
  }

  return (
    <Button
      data-cy="sendButton"
      onClick={sendReport}
      disabled={!isValidReport(parseReport(newReport))}
      className="right floated negative ui button"
      content="Lähetä raportti"
    />
  )
}
