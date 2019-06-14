import React from 'react'
import { List } from 'semantic-ui-react'

export default ({ messages }) => {
  const formatMessages = () => messages.map((message) => {
    if (message.type === 'error') {
      return (
        <List.Item key={message.content}>
            VIRHE:
          {message.content}
        </List.Item>
      )
    }
    return (
      <List.Item key={message.content}>
          HUOM:
        {message.content}
      </List.Item>
    )
  })

  return (
    <div>
      <List>{formatMessages()}</List>
    </div>
  )
}
