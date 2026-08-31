import DataTable from '@client/components/DataTable'
import { revokeApiKeyAction } from '@client/utils/redux/apiKeysReducer'
import { Box, Button, Chip } from '@mui/material'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'

const never = (label) => (
  <Box component="span" sx={{ color: 'gray' }}>
    {label}
  </Box>
)

const date = (value) => (value ? moment(value).format('DD.MM.YYYY HH:mm') : never('Never'))

const RevokeButton = ({ apiKey }) => {
  const dispatch = useDispatch()

  if (!apiKey.active) return never('Revoked')

  return (
    <Button
      size="small"
      color="error"
      variant="outlined"
      data-cy={`revoke-api-key-${apiKey.id}`}
      onClick={() => dispatch(revokeApiKeyAction(apiKey.id))}
    >
      Revoke
    </Button>
  )
}

const columns = [
  { key: 'name', header: 'Name', width: '22%', sortable: true },
  { key: 'client', header: 'Client', width: '12%', sortable: true },
  {
    key: 'prefix',
    header: 'Token',
    width: '16%',
    render: (apiKey) => <Box component="code">{apiKey.prefix}…</Box>
  },
  {
    key: 'active',
    header: 'Status',
    width: '10%',
    align: 'center',
    sortable: true,
    render: (apiKey) =>
      apiKey.active ? (
        <Chip size="small" color="success" label="Active" />
      ) : (
        <Chip size="small" label={apiKey.revokedAt ? 'Revoked' : 'Expired'} />
      )
  },
  { key: 'lastUsedAt', header: 'Last used', width: '15%', sortable: true, render: (k) => date(k.lastUsedAt) },
  { key: 'createdAt', header: 'Created', width: '15%', sortable: true, render: (k) => date(k.createdAt) },
  { key: 'actions', header: '', width: '10%', align: 'center', render: (k) => <RevokeButton apiKey={k} /> }
]

export default () => {
  const apiKeys = useSelector((state) => state.apiKeys.data)

  return (
    <DataTable
      data-cy="api-key-grid"
      columns={columns}
      rows={apiKeys}
      rowKey={(apiKey) => apiKey.id}
      defaultSort={[{ key: 'createdAt', direction: 'desc' }]}
    />
  )
}
