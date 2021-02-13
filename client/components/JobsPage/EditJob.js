import React, { useState } from 'react'
import EditJobForm from 'Components/JobsPage/EditJobForm'
import { Modal, Button } from 'semantic-ui-react'

export default ({ job, jobs }) => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <Modal
      trigger={
        <Button
          disabled={jobs.pending}
          onClick={() => setShowForm(true)}
        >
          Edit
        </Button>
      }
      basic
      open={showForm}
      onClose={closeModal}
      size="small"
    >
      <Modal.Content>
        <EditJobForm job={job} close={closeModal} />
      </Modal.Content>
    </Modal>
  )
}
