import ApiKeyForm from '@client/components/ApiKeysPage/ApiKeyForm'
import ApiKeyTable from '@client/components/ApiKeysPage/ApiKeyTable'
import CreatedTokenAlert from '@client/components/ApiKeysPage/CreatedTokenAlert'
import FormDialog from '@client/components/FormDialog'
import Message from '@client/components/Message'
import { getApiKeysAction } from '@client/utils/redux/apiKeysReducer'
import { Alert, Button } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getApiKeysAction())
  }, [dispatch])

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Credentials for machines that call Suotar's API. Revoking a key takes effect on the next request; several keys
        can be active at once, which is how a key is rotated without downtime.
      </Alert>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" color="success" data-cy="add-api-key-button" onClick={open}>
            Create new API key
          </Button>
        )}
      >
        {(close) => <ApiKeyForm close={close} />}
      </FormDialog>
      <CreatedTokenAlert />
      <Message />
      <ApiKeyTable />
    </>
  )
}
