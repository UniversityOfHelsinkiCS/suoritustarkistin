import React from 'react'
import { Tooltip } from '@mui/material'
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined'

// Shared by the new and edit course forms, which both had their own copy.
const Help = ({ text }) => (
  <Tooltip title={text}>
    <HelpOutlinedIcon fontSize="small" sx={{ ml: '7px', verticalAlign: 'middle' }} />
  </Tooltip>
)

export default Help
