import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sisSendNewReportAction } from 'Utilities/redux/sisNewReportReducer'
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
  const sisNewReport = useSelector((state) => state.sisNewReport)

  const sendReport = () => {
    dispatch(sisSendNewReportAction(parseReport(sisNewReport)))
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
              sisNewReport.sending || !isValidReport(parseReport(sisNewReport))
            }
            content="Send report"
          />
        </span>
      }
      content="Report contains validation errors, see table below."
      disabled={!sisNewReport.data || isValidReport(parseReport(sisNewReport))}
      style={{ color: 'red' }}
    />
  )
}