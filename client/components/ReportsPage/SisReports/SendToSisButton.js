import React, { useState } from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendEntriesToSisAction } from 'Utilities/redux/sisReportsReducer'

export default ({ entries }) => {
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const reports = useSelector((state) => state.sisReports)

  const sendNewEntries = () => {
    setIsOpen(false)
    dispatch(sendEntriesToSisAction(entries))
  }

  return (
    <Popup
      trigger={
        <Button
          positive
          content="Send completions to Sisu"
          loading={reports.pending}
          disabled={
            reports.pending || !entries.length
          }
        />
      }
      open={isOpen}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      content={
        <Button
          positive
          data-cy="sendButton"
          onClick={sendNewEntries}
          loading={reports.pending}
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
