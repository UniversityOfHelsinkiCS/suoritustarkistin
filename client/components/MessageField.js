import React from 'react'
import { Message } from 'semantic-ui-react'

export default ({ message, setMessage }) => {
  if (message) {
    return (
      <Message
        positive
        onDismiss={() => setMessage(null)}
        header="Tärkeä huomautus!"
        content={message}
      />
    )
  } else {
    return null
  }
}
