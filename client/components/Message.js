import React from 'react'
import { Message } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { clearMessageAction } from 'Utilities/redux/messageReducer'


export default () => {
  const dispatch = useDispatch()
  const message = useSelector((state) => state.message)

  const resolveColor = (type) => {
    if (!type) return 'blue'
    if (type === 'neutral') return 'grey'
    if (type === 'positive') return 'green'
    if (type === 'negative') return 'red'
    return type
  }

  if (!message) return null

  return <Message
    data-cy={`${message.type}-message`}
    color={resolveColor(message.type)}
    onDismiss={() => dispatch(clearMessageAction())}
    header={message.header}
    content={message.content}
  />
}
