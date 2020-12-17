import React from 'react'
import { Button } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendNewRawEntriesAction } from 'Utilities/redux/sisNewRawEntriesReducer'

/* const parseRawEntries = (rawEntries) => {
  if (!rawEntries.data) return rawEntries

  return {
    ...rawEntries,
    data: rawEntries.data.map((row) => {
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
} */

export default () => {
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)

  const sendRawEntries = () => {
    dispatch(sendNewRawEntriesAction(newRawEntries))
  }

  return (
    <Button
      positive
      data-cy="sendButton"
      onClick={sendRawEntries}
      disabled={
        newRawEntries.sending  //|| !sisAreValidNewRawEntries(parseRawEntries(newRawEntries))
      }
      content="Send report"
    />
  )
}