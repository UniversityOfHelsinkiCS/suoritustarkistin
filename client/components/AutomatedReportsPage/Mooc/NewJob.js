import React, { useState } from 'react'
import NewJobForm from 'Components/AutomatedReportsPage/Mooc/NewJobForm'
import { Modal, Button } from 'semantic-ui-react'

export default () => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <Modal
      trigger={
        <Button
          data-cy="add-job-button"
          positive
          onClick={() => setShowForm(true)}
        >
          Add new job
        </Button>
      }
      basic
      open={showForm}
      onClose={closeModal}
      size="small"
    >
      <Modal.Content>
        <NewJobForm close={closeModal} />
      </Modal.Content>
    </Modal>
  )
}
