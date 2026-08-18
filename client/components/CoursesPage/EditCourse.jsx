import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import EditCourseForm from '@client/components/CoursesPage/EditCourseForm'

export default ({ course }) => {
  const [showForm, setShowForm] = useState(false)

  const closeModal = () => setShowForm(false)

  return (
    <>
      <Button variant="contained" data-cy={`${course.courseCode}-edit-button`} onClick={() => setShowForm(true)}>
        Edit
      </Button>
      <Dialog open={showForm} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogContent>
          <EditCourseForm course={course} close={closeModal} />
        </DialogContent>
      </Dialog>
    </>
  )
}
