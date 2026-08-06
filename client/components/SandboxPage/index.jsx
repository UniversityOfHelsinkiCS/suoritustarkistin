import React, { useEffect, useState } from 'react'
import { callApi } from '@client/utils/apiConnection'
import { Button, Grid, Header, Icon, Message, Segment } from 'semantic-ui-react'

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
      await callApi('/sandbox')
    } catch {
      setMessage('Backend exploded successfully')
    }
  }

  // Reported by the global unhandled-rejection handler, not by the express one, so
  // this is the button that proves Sentry was initialised before the app loaded.
  const crashBackendAsync = async () => {
    const { data } = await callApi('/sandbox/unhandled-rejection')
    setMessage(data)
  }

  // Caught and reported by hand, the way the cron scripts do it.
  const captureBackendError = async () => {
    const { data } = await callApi('/sandbox/captured-error')
    setMessage(data)
  }

  // Rejects with no catch anywhere: reported by the browser SDK's global handler
  // rather than by the ErrorBoundary, which only sees errors thrown while rendering.
  const crashFrontendAsync = () => {
    setMessage('Frontend unhandled rejection triggered')
    Promise.reject(new Error('Suotar frontend exploded asynchronously!'))
  }

  return (
    <Segment textAlign="center">
      <Header size="large">Sandbox, playground for developers</Header>
      {message && (
        <Message style={{ maxWidth: 400, marginRight: 'auto', marginLeft: 'auto', textAlign: 'left' }} icon success>
          <Icon name="bomb" />
          <Message.Content>
            <Message.Header>Backend sandbox</Message.Header>
            {message}
          </Message.Content>
        </Message>
      )}
      {process.env.NODE_ENV !== 'development' ? (
        <Header size="medium">Frontend built at {import.meta.env.VITE_BUILT_AT || 'unknown'}</Header>
      ) : null}
      {/* Paired frontend/backend per row, one row per path an error takes to Sentry. */}
      <Grid columns={2} stackable style={{ maxWidth: 800, margin: '0 auto' }}>
        <Grid.Row style={{ paddingBottom: '1.5rem' }}>
          <Grid.Column>
            <Button
              fluid
              size="huge"
              basic
              color="red"
              content="Chaos Monkey"
              icon="bomb"
              onClick={() => setCrash(true)}
            />
          </Grid.Column>
          <Grid.Column>
            <Button
              fluid
              size="huge"
              basic
              color="red"
              content="Chaos Monkey backend"
              icon="bomb"
              onClick={crashBackend}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row style={{ paddingBottom: '1.5rem' }}>
          <Grid.Column>
            <Button
              fluid
              size="huge"
              basic
              color="orange"
              content="Frontend unhandled rejection"
              icon="bomb"
              onClick={crashFrontendAsync}
            />
          </Grid.Column>
          <Grid.Column>
            <Button
              fluid
              size="huge"
              basic
              color="orange"
              content="Backend unhandled rejection"
              icon="bomb"
              onClick={crashBackendAsync}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column>
            <Button
              fluid
              size="huge"
              basic
              color="yellow"
              content="Backend captured error"
              icon="bug"
              onClick={captureBackendError}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
  )
}
