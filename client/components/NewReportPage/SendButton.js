import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
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
    <Popup
      trigger={
        <span style={{ float: 'right' }}>
          <Button
            positive
            data-cy="sendButton"
            onClick={sendReport}
            disabled={
              newReport.sending || !isValidReport(parseReport(newReport))
            }
            content="Send report"
          />
        </span>
      }
      content="Report contains validation errors, see table below."
      disabled={!newReport.data || isValidReport(parseReport(newReport))}
      style={{ color: 'red' }}
    />
  )
}
