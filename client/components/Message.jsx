import { clearMessageAction } from '@client/utils/redux/messageReducer'
import { Alert, AlertTitle } from '@mui/material'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default () => {
  const dispatch = useDispatch()
  const message = useSelector((state) => state.message)

  const resolveSeverity = (type) => {
    if (!type) return 'info'
    if (type === 'neutral') return 'info'
    if (type === 'positive') return 'success'
    if (type === 'negative') return 'error'
    // Alert only accepts error/warning/info/success, so anything else must not pass through
    return 'info'
  }

  if (!message) return null

  return (
    <Alert
      data-cy={`${message.type}-message`}
      severity={resolveSeverity(message.type)}
      onClose={() => dispatch(clearMessageAction())}
    >
      {message.header ? <AlertTitle>{message.header}</AlertTitle> : null}
      {message.content}
    </Alert>
  )
}
