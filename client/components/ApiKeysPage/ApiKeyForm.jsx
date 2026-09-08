import { addApiKeyAction } from '@client/utils/redux/apiKeysReducer'
import { Button, MenuItem, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

const CLIENTS = [{ value: 'moocfi', label: 'courses.mooc.fi' }]

export default ({ close }) => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [client, setClient] = useState(CLIENTS[0].value)

  const submit = () => {
    dispatch(addApiKeyAction({ name, client }))
    close()
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
      <TextField
        select
        label="Client"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        data-cy="api-key-client"
      >
        {CLIENTS.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" color="success" disabled={!name} onClick={submit} data-cy="create-api-key">
          Create
        </Button>
      </Stack>
    </Stack>
  )
}
