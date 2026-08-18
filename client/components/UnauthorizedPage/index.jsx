import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'

export default () => {
  const user = useSelector((state) => state.user)

  // Mainly for development purposes:
  if (user.data.isAdmin || user.data.isGrader) {
    return <Navigate to="/" state={{ from: '/unauthorized' }} replace />
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Alert severity="error">
        Your account has been created. Before you can start using the service, your account must be approved manually by
        one of SUOTAR's administrators.
        <br />
        <br />
        To get your account approved, you must send an email{' '}
        <span style={{ fontWeight: 'bold' }}>(including the details of the course you want to grade)</span> to{' '}
        <a target="_blank" rel="noopener noreferrer" href="mailto:grp-toska@helsinki.fi">
          grp-toska@helsinki.fi
        </a>
      </Alert>
    </Paper>
  )
}
