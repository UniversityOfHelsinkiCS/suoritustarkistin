import { dismissCreatedTokenAction } from '@client/utils/redux/apiKeysReducer'
import { Alert, AlertTitle, Box, Button, Stack } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

// The only place the plaintext token is ever shown; once dismissed it is unrecoverable.
export default () => {
  const dispatch = useDispatch()
  const createdToken = useSelector((state) => state.apiKeys.createdToken)

  if (!createdToken) return null

  return (
    <Alert severity="warning" data-cy="created-token" sx={{ my: 2 }}>
      <AlertTitle>Copy this token now</AlertTitle>
      <Box>This is the only time it is shown. Suotar stores only a hash of it and cannot show it again.</Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <Box component="code" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, wordBreak: 'break-all', flexGrow: 1 }}>
          {createdToken}
        </Box>
        <Button variant="outlined" onClick={() => navigator.clipboard?.writeText(createdToken)}>
          Copy
        </Button>
        <Button variant="contained" onClick={() => dispatch(dismissCreatedTokenAction())}>
          Done
        </Button>
      </Stack>
    </Alert>
  )
}
