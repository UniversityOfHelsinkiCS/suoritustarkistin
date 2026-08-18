import EduwebInstance from '@client/components/ApiChecks/EduwebInstance'
import { checkEduWeb } from '@client/utils/redux/apiCheckReducer'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default () => {
  const dispatch = useDispatch()
  const { eduweb } = useSelector((state) => state.apiChecks)
  const [data, setData] = useState({ course: '' })
  const [active, setActive] = useState(0)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkEduWeb(data.course))
  }

  const getInstanceCards = (eduweb) => {
    const instances = eduweb?.instances
    if (!eduweb) return ''
    if (!instances || !instances.length) return <b>No instances found from Eduweb-api with the course code</b>

    return (
      <div>
        {eduweb.instances.map((instance) => (
          <EduwebInstance key={instance.oodi_id} instance={instance} active={active} setActive={setActive} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Eduweb check
      </Typography>
      <Box component="form" onSubmit={handleCheck} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Enter course code"
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
      {getInstanceCards(eduweb)}
    </div>
  )
}
