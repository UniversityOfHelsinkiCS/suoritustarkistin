import React from 'react'
import { Message } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { clearMessageAction } from 'Utilities/redux/messageReducer'

export default () => {
  const dispatch = useDispatch()
  const message = useSelector((state) => state.message)

  if (!message) return null

  if (message.type === 'positive') {
    setTimeout(() => {
      dispatch(clearMessageAction())
    }, 8000)
    return (
      <Message
        data-cy="positive-message"
        positive
        onDismiss={() => dispatch(clearMessageAction())}
        header={message.header}
        content={message.content}
      />
    )
  }

  if (message.type === 'negative') {
    return (
      <Message
        data-cy="negative-message"
        negative
        onDismiss={() => dispatch(clearMessageAction())}
        header={message.header}
        content={message.content}
      />
    )
  }

  setTimeout(() => {
    dispatch(clearMessageAction())
  }, 8000)
  return (
    <Message
      info
      onDismiss={() => dispatch(clearMessageAction())}
      header={message.header}
      content={message.content}
    />
  )
}
