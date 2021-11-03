import React, { useState } from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'

import { sendEntriesToSisAction } from 'Utilities/redux/sisReportsReducer'


export default ({ idsToSend }) => {
  const { entries, extraEntries } = idsToSend
  const dispatch = useDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const reports = useSelector((state) => state.sisReports)

  const sendNewEntries = () => {
    setIsOpen(false)
    dispatch(sendEntriesToSisAction(entries, extraEntries))
  }

  const getConfirmMessage = () => `Are you sure? Sending ${entries.length} ${extraEntries.length ? `+ ${extraEntries.length}` : ''} completion(s)`

  return (
    <Popup
      trigger={
        <Button
          positive
          content="Send completions to Sisu"
          loading={reports.pending}
          disabled={
            reports.pending || (!entries.length && !extraEntries)
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
          content={getConfirmMessage()}
        />
      }
      on="click"
      position="top center"
    />
  )
}
