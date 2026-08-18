import React, { useState } from 'react'
import { Button, Dialog, DialogContent } from '@mui/material'

import NewJobForm from '@client/components/AutomatedReportsPage/Mooc/NewJobForm'

export default () => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <>
      <Button variant="contained" color="success" data-cy="add-job-button" onClick={() => setShowForm(true)}>
        Add new job
      </Button>
      <Dialog open={showForm} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogContent>
          <NewJobForm close={closeModal} />
        </DialogContent>
      </Dialog>
    </>
  )
}
