import React from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const TabLoader = () => (
  <Box sx={{ height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <CircularProgress size={50} />
  </Box>
)

export default TabLoader
