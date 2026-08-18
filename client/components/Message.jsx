import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { useDispatch, useSelector } from 'react-redux'
import { clearMessageAction } from '@client/utils/redux/messageReducer'

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
