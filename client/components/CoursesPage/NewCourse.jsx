import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import NewCourseForm from '@client/components/CoursesPage/NewCourseForm'

export default () => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <>
      <Button variant="contained" color="success" data-cy="add-course-button" onClick={() => setShowForm(true)}>
        Add new course
      </Button>
      <Dialog open={showForm} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogContent>
          <NewCourseForm close={closeModal} />
        </DialogContent>
      </Dialog>
    </>
  )
}
