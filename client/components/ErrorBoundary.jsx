import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied'
import * as Sentry from '@sentry/react'

const ErrorView = ({ error }) => (
  <Box sx={{ textAlign: 'center', width: '100%', height: '100%' }}>
    <Alert severity="error" icon={false} sx={{ maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
      <AlertTitle>Something broke</AlertTitle>
      <SentimentVeryDissatisfiedIcon sx={{ margin: '2rem', fontSize: '8rem', color: '#91332b' }} />
      <p>
        <b>
          If the error persists, please contact <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </b>
      </p>
      {process.env.NODE_ENV === 'development' ? <p>{error.stack}</p> : null}
    </Alert>
  </Box>
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
