import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import { useDispatch, useSelector } from 'react-redux'

import { handleBatchDeletionAction, openReport } from '@client/utils/redux/sisReportsReducer'

export default ({ batchId }) => {
  const [anchor, setAnchor] = useState(null)
  const dispatch = useDispatch()
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)

  const deleteBatch = () => {
    dispatch(handleBatchDeletionAction(batchId))
    dispatch(openReport(batchId))
  }

  return (
    <>
      <Button
        variant="contained"
        color="error"
        data-cy="report-delete-batch-button"
        disabled={!batchId}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        Delete completions
      </Button>
      <Popover
        // Semantic tied the popup to the accordion being open; closing the report
        // dismissed it.
        open={Boolean(anchor) && openAccordions.includes(batchId)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box className="delete-popup" sx={{ p: 2 }}>
          <Typography>
            <strong>Are you sure?</strong>
          </Typography>
          <Typography sx={{ padding: '5px 2px' }}>
            Please note that deleting the completion-report here, will not affect completions already sent to SIS.
          </Typography>
          <Button
            sx={{ margin: '5px 2px' }}
            variant="contained"
            color="error"
            data-cy="report-delete-batch-confirm"
            onClick={deleteBatch}
            disabled={!batchId}
          >
            Yes, delete completions
          </Button>
        </Box>
      </Popover>
    </>
  )
}
