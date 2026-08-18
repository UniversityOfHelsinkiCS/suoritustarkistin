import EditJobForm from '@client/components/AutomatedReportsPage/Mooc/EditJobForm'
import { Button, Dialog, DialogContent } from '@mui/material'
import { useState } from 'react'

export default ({ job, jobs }) => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <>
      <Button variant="contained" data-cy="edit-job" disabled={jobs.pending} onClick={() => setShowForm(true)}>
        Edit
      </Button>
      <Dialog open={showForm} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogContent>
          <EditJobForm job={job} close={closeModal} />
        </DialogContent>
      </Dialog>
    </>
  )
}
