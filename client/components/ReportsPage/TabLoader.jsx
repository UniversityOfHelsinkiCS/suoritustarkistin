import { Box, CircularProgress } from '@mui/material'
import React from 'react'

const TabLoader = () => (
  <Box sx={{ height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <CircularProgress size={50} />
  </Box>
)

export default TabLoader
