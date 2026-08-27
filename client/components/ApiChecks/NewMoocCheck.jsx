import { checkNewMooc } from '@client/utils/redux/apiCheckReducer'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, Checkbox, FormControlLabel, InputAdornment, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useDispatch } from 'react-redux'

import NewMoocInstance from './NewMoocInstance'

export default () => {
  const dispatch = useDispatch()
  const [data, setData] = useState({ course: '' })
  const [registered, setRegistered] = useState(true)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkNewMooc(data.course, registered))
  }

  const moocPath = `/study-registry/completions/${data.course}${registered ? '' : '?exclude_already_registered=true'}`

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        New Mooc check
      </Typography>
      <Box component="form" onSubmit={handleCheck} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Enter course code, course id or mooc-slug"
          value={data.course || ''}
          placeholder="DATA20041"
          onChange={(e) => setData({ course: e.target.value })}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
                    Check
                  </Button>
                </InputAdornment>
              )
            }
          }}
        />
        <Typography variant="body2" component="p" sx={{ mt: 1, fontFamily: 'monospace' }}>
          {moocPath}
        </Typography>
        <FormControlLabel
          control={<Checkbox checked={registered} onChange={(e) => setRegistered(e.target.checked)} />}
          label="Include completions already registered to SIS"
        />
      </Box>
      <NewMoocInstance />
    </div>
  )
}
