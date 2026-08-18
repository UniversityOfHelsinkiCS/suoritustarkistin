import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { checkMooc } from '@client/utils/redux/apiCheckReducer'
import MoocInstance from './MoocInstance'

export default () => {
  const dispatch = useDispatch()
  const [data, setData] = useState({ course: '' })

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkMooc(data.course))
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Mooc check
      </Typography>
      <Box component="form" onSubmit={handleCheck} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Enter course code or mooc-slug"
          value={data.course || ''}
          placeholder="TKT10002"
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
      <MoocInstance />
    </div>
  )
}
