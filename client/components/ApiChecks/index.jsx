import React from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

import Message from '@client/components/Message'
import EduwebCheck from '@client/components/ApiChecks/EduwebCheck'
import MoocCheck from '@client/components/ApiChecks/MoocCheck'
import NewMoocCheck from './NewMoocCheck'
import SisuCheck from './SisuCheck'

export default () => {
  const { pending } = useSelector((state) => state.apiChecks)

  return (
    <>
      <Message />
      {pending ? <CircularProgress size={50} /> : null}
      {/* Two columns, as the 8-of-16 Grid widths gave */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EduwebCheck />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MoocCheck />
        </Box>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <NewMoocCheck />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SisuCheck />
        </Box>
      </Stack>
    </>
  )
}
