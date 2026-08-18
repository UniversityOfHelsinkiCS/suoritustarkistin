import React from 'react'
import { Tooltip } from '@mui/material'
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined'

const Help = ({ text }) => (
  <Tooltip title={text}>
    <HelpOutlinedIcon fontSize="small" sx={{ ml: '7px', verticalAlign: 'middle' }} />
  </Tooltip>
)

export default Help
