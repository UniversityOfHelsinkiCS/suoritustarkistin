import React from 'react'
import { Segment, Message, Icon } from 'semantic-ui-react'


const ErrorView = ({ error }) => <Segment textAlign="center" style={{ width: '100%', height: '100%' }}>
  <Message style={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }} size="large" error>
    <Message.Header>Something broke</Message.Header>
    <Message.Content>
      <Icon name="frown outline" color="#91332b" size="massive" style={{ margin: '2rem' }} />
      <p><b>If the error persists, please contact grp-toska@cs.helsinki.fi.</b></p>
      {process.env.NODE_ENV === "development" ? <p>{error.stack}</p> : null}
    </Message.Content>
  </Message>

</Segment>


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error)
      return <ErrorView error={error} />
    return this.props.children

  }
}

export default ErrorBoundary
