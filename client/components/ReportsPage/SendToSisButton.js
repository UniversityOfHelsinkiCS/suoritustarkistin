import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sisSendNewReportAction } from 'Utilities/redux/sisNewReportReducer'

export default () => {
  const dispatch = useDispatch()
  const sisNewReport = useSelector((state) => state.sisNewReport)

  const sendReport = () => {
    dispatch(sisSendNewReportAction(sisNewReport))
  }

  return (
    <Popup
        trigger={
          <Button
            positive
            onClick={sendReport}
            disabled={
              sisNewReport.sending
            }
            content="Send report to SIS"
          />
        }
        content={
          <Button
            positive
            data-cy="sendButton"
            onClick={sendReport}
            disabled={
              sisNewReport.sending
            }
            content="Are you sure?"
          />
        }
        on="click"
        position="top center"
      />
  )
}
