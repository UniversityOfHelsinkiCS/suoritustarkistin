import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { checkNewMooc } from '@client/utils/redux/apiCheckReducer'
import NewMoocInstance from './NewMoocInstance'

export default () => {
  const dispatch = useDispatch()
  const [data, setData] = useState({ course: '' })

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkNewMooc(data.course))
  }

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
      </Box>
      <NewMoocInstance />
    </div>
  )
}
