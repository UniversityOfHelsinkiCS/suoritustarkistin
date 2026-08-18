import { sendEntriesToSisAction } from '@client/utils/redux/sisReportsReducer'
import { Box, Button, Popover } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default ({ idsToSend }) => {
  const { entries, extraEntries } = idsToSend
  const dispatch = useDispatch()
  const [anchor, setAnchor] = useState(null)
  const reports = useSelector((state) => state.sisReports)

  const sendNewEntries = () => {
    setAnchor(null)
    dispatch(sendEntriesToSisAction(entries, extraEntries))
  }

  const getConfirmMessage = () =>
    `Are you sure? Sending ${entries.length} ${extraEntries.length ? `+ ${extraEntries.length}` : ''} completion(s)`

  if (!entries.length && !extraEntries.length) return null

  return (
    <>
      <Button
        variant="contained"
        color="success"
        loading={reports.pending}
        disabled={reports.pending || (!entries.length && !extraEntries.length)}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        Send completions to Sisu
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{ p: 1 }}>
          <Button
            variant="contained"
            color="success"
            data-cy="sendButton"
            onClick={sendNewEntries}
            loading={reports.pending}
            disabled={reports.pending || (!entries.length && !extraEntries)}
          >
            {getConfirmMessage()}
          </Button>
        </Box>
      </Popover>
    </>
  )
}
