import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, Header, Icon, Message, Segment } from 'semantic-ui-react'


export default () => {
  const [crash, setCrash] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (crash) {
      throw new Error('Suotar is on fire!')
    }
  }, [crash])

  const crashBackend = async () => {
    try {
      await axios.get(`${__BASE_PATH__}api/sandbox`)
    } catch (e) {
      setMessage('Backend exploded successfully')
    }
  }

  return (
    <Segment textAlign="center">
      <Header size="large">Sandbox, playground for developers</Header>
      {message && <Message style={{ maxWidth:400, marginRight: 'auto', marginLeft: 'auto', textAlign: 'left' }} icon success>
        <Icon name='bomb' />
        <Message.Content>
          <Message.Header>Backend sandbox</Message.Header>
          {message}
        </Message.Content>
      </Message>}
      { process.env.NODE_ENV !== "development"
        ? <Header size="medium">Frontend built at {process.env.BUILT_AT || 'unknown'}</Header>
        : null}
      <Button
        size="huge"
        basic
        color="red"
        content="Chaos Monkey"
        icon="bomb"
        onClick={() => setCrash(true)}
      />
      <Button
        size="huge"
        basic
        color="red"
        content="Chaos Monkey backend"
        icon="bomb"
        onClick={crashBackend}
      />
    </Segment>
  )
}
