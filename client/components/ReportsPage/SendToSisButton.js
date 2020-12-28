import React from 'react'
import { Button, Popup } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendNewEntriesAction } from 'Utilities/redux/sisNewEntriesReducer'

export default () => {
  const dispatch = useDispatch()
  const newEntries = useSelector((state) => state.newEntries)

  const sendNewEntries = () => {
    dispatch(sendNewEntriesAction(newEntries))
  }

  return (
    <Popup
        trigger={
          <Button
            positive
            onClick={sendNewEntries}
            disabled={
              newEntries.sending
            }
            content="Send completions to SIS"
          />
        }
        content={
          <Button
            positive
            data-cy="sendButton"
            onClick={sendNewEntries}
            disabled={
              newEntries.sending
            }
            content="Are you sure?"
          />
        }
        on="click"
        position="top center"
      />
  )
}
