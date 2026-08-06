import React from 'react'
import { Icon, Message, Segment } from 'semantic-ui-react'
import * as Sentry from '@sentry/react'

const ErrorView = ({ error }) => (
  <Segment textAlign="center" style={{ width: '100%', height: '100%' }}>
    <Message style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }} size="large" error>
      <Message.Header>Something broke</Message.Header>
      <Message.Content>
        <Icon name="frown outline" size="massive" style={{ margin: '2rem', color: '#91332b' }} />
        <p>
          <b>
            If the error persists, please contact <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
          </b>
        </p>
        {process.env.NODE_ENV === 'development' ? <p>{error.stack}</p> : null}
      </Message.Content>
    </Message>
  </Segment>
)

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  // Without this the boundary swallows the error: rendering the fallback below counts
  // as handling it, so it never reaches window.onerror and never reaches Sentry.
  componentDidCatch(error, info) {
    Sentry.captureException(error, { contexts: { react: info } })
  }

  render() {
    const { error } = this.state
    if (error) return <ErrorView error={error} />
    const { children } = this.props
    return children
  }
}

export default ErrorBoundary
