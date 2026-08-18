import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material'

import { deleteCourseAction } from '@client/utils/redux/coursesReducer'

const DeletionModal = ({ showForm, setShowForm, id }) => {
  const dispatch = useDispatch()
  const unsent = useSelector((state) => state.courses.unsent)
  const closeModal = () => setShowForm(false)

  const deleteCourse = (id) => {
    dispatch(deleteCourseAction(id))
    closeModal()
  }

  return (
    <Dialog open={showForm} onClose={closeModal} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', padding: '2em' }}>
        <Typography variant="h5" component="h2">
          Are you sure you want to delete the course?
        </Typography>
        <Typography sx={{ mt: 2 }}>
          {unsent > 0 &&
            `There are still ${unsent} completions to this course that 
                have not been sent to SIS. Those will be deleted as well.`}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          data-cy="confirm-course-deletion-button"
          color="error"
          onClick={() => deleteCourse(id)}
        >
          Yes, delete the course {unsent > 0 && 'and unsent completions'}
        </Button>
        <Button variant="outlined" onClick={closeModal}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeletionModal
