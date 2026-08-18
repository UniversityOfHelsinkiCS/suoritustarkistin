import NewCourseForm from '@client/components/CoursesPage/NewCourseForm'
import { Button, Dialog, DialogContent } from '@mui/material'
import { useState } from 'react'

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
