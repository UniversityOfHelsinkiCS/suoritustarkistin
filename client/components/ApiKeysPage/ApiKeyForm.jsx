import { callApi } from '@client/utils/apiConnection'
import { getApiKeysAction } from '@client/utils/redux/apiKeysReducer'
import { setMessageAction } from '@client/utils/redux/messageReducer'
import { Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

export default ({ close, onCreated }) => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')

  // intentionally not putting the api key into redux thunk
  const submit = async () => {
    close()
    try {
      const { data } = await callApi('/api_keys', 'post', { name })
      onCreated(data.token)
      dispatch(getApiKeysAction())
    } catch {
      dispatch(setMessageAction({ header: 'Creating the API key failed', type: 'negative' }))
    }
  }

  return (
    <Stack spacing={2} sx={{ pt: 1, minWidth: 400 }}>
      <TextField
        label="Name"
        helperText="What this key is for, e.g. courses.mooc.fi production"
        value={name}
        onChange={(e) => setName(e.target.value)}
        data-cy="api-key-name"
      />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" color="success" disabled={!name} onClick={submit} data-cy="create-api-key">
          Create
        </Button>
      </Stack>
    </Stack>
  )
}
