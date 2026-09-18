import { Alert, AlertTitle, Box, Button, Stack } from '@mui/material'

// The only place the plaintext token is ever shown; once dismissed it is unrecoverable.
export default ({ token, dismiss }) => {
  if (!token) return null

  return (
    <Alert severity="warning" data-cy="created-token" sx={{ my: 2 }}>
      <AlertTitle>Copy this token now</AlertTitle>
      <Box>This is the only time it is shown. Suotar stores only a hash of it and cannot show it again.</Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Box component="code" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, wordBreak: 'break-all', flexGrow: 1 }}>
          {token}
        </Box>
        <Button variant="outlined" onClick={() => navigator.clipboard?.writeText(token)}>
          Copy
        </Button>
        <Button variant="contained" onClick={dismiss}>
          Done
        </Button>
      </Stack>
    </Alert>
  )
}
