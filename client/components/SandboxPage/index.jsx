import React, { useEffect, useState } from 'react'
import { callApi } from '@client/utils/apiConnection'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BugReportIcon from '@mui/icons-material/BugReport'

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
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Sandbox, playground for developers
      </Typography>
      {message && (
        <Alert severity="success" sx={{ maxWidth: 400, marginRight: 'auto', marginLeft: 'auto', textAlign: 'left' }}>
          <AlertTitle>Backend sandbox</AlertTitle>
          {message}
        </Alert>
      )}
      {process.env.NODE_ENV !== 'development' ? (
        <Typography variant="h6" component="h2">
          Frontend built at {import.meta.env.VITE_BUILT_AT || 'unknown'}
        </Typography>
      ) : null}
      {/* Paired frontend/backend per row, one row per path an error takes to Sentry. */}
      <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pb: '1.5rem' }}>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="error"
            startIcon={<BugReportIcon />}
            onClick={() => setCrash(true)}
          >
            Chaos Monkey
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="error"
            startIcon={<BugReportIcon />}
            onClick={crashBackend}
          >
            Chaos Monkey backend
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pb: '1.5rem' }}>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="warning"
            startIcon={<BugReportIcon />}
            onClick={crashFrontendAsync}
          >
            Frontend unhandled rejection
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="warning"
            startIcon={<BugReportIcon />}
            onClick={crashBackendAsync}
          >
            Backend unhandled rejection
          </Button>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="warning"
            startIcon={<BugReportIcon />}
            onClick={captureBackendError}
          >
            Backend captured error
          </Button>
          <Box sx={{ width: '100%' }} />
        </Stack>
      </Box>
    </Paper>
  )
}
