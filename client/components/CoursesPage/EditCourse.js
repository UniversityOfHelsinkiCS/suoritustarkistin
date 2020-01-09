import React, { useState } from 'react'
import EditCourseForm from 'Components/CoursesPage/EditCourseForm'
import { Modal, Button } from 'semantic-ui-react'

export default ({ course }) => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <Modal
      trigger={
        <Button
          data-cy={`${course.courseCode}-edit-button`}
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
        <EditCourseForm course={course} close={closeModal} />
      </Modal.Content>
    </Modal>
  )
}
