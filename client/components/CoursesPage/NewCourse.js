import React, { useState } from 'react'
import NewCourseForm from 'Components/CoursesPage/NewCourseForm'
import { Modal, Button } from 'semantic-ui-react'

export default () => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <Modal
      trigger={
        <Button
          data-cy="add-course-button"
          positive
          onClick={() => setShowForm(true)}
        >
          Add new course
        </Button>
      }
      basic
      open={showForm}
      onClose={closeModal}
      size="small"
    >
      <Modal.Content>
        <NewCourseForm close={closeModal} />
      </Modal.Content>
    </Modal>
  )
}
