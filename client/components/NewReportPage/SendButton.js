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
    }),
    sending: undefined,
    rawData: undefined
  }
}

export default () => {
  const dispatch = useDispatch()
  const newReport = useSelector((state) => state.newReport)

  const sendReport = () => {
    dispatch(sendNewReportAction(parseReport(newReport)))
  }

  return (
    <Button
      positive
      floated="right"
      data-cy="sendButton"
      onClick={sendReport}
      disabled={newReport.sending || !isValidReport(parseReport(newReport))}
      content="Lähetä raportti"
    />
  )
}
