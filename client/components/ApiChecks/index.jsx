import EduwebCheck from '@client/components/ApiChecks/EduwebCheck'
import MoocCheck from '@client/components/ApiChecks/MoocCheck'
import Message from '@client/components/Message'
import { Box, CircularProgress, Stack } from '@mui/material'
import { useSelector } from 'react-redux'

import NewMoocCheck from './NewMoocCheck'
import SisuCheck from './SisuCheck'

export default () => {
  const { pending } = useSelector((state) => state.apiChecks)

  return (
    <>
      <Message />
      {pending ? <CircularProgress size={50} /> : null}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <EduwebCheck />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SisuCheck />
        </Box>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MoocCheck />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <NewMoocCheck />
        </Box>
      </Stack>
    </>
  )
}
