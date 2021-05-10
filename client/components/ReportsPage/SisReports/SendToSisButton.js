import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendEntriesToSisAction } from 'Utilities/redux/sisReportsReducer'

export default ({ entries }) => {
  const dispatch = useDispatch()
  const reports = useSelector((state) => state.sisReports)

  const sendNewEntries = () => {
    dispatch(sendEntriesToSisAction(entries))
  }

  return (
    <Popup
      trigger={
        <Button
          positive
          content="Send completions to Sisu"
          disabled={
            reports.pending || !entries.length
          }
        />
      }
      content={
        <Button
          positive
          data-cy="sendButton"
          onClick={sendNewEntries}
          disabled={
            reports.pending || !entries.length
          }
          content={`Are you sure? Sending ${entries.length} completion(s)`}
        />
      }
      on="click"
      position="top center"
    />
  )
}
