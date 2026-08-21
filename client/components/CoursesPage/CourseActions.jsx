import ConfirmPopover from '@client/components/ConfirmPopover'
import EditCourseForm from '@client/components/CoursesPage/EditCourseForm'
import { RowActions } from '@client/components/DataTable'
import FormDialog from '@client/components/FormDialog'
import { confirmDeletionAction, deleteCourseAction } from '@client/utils/redux/coursesReducer'
import { Button, Stack, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

const DeleteConfirm = ({ close, onConfirm }) => {
  const { unsent, pending } = useSelector((state) => state.courses)

  return (
    <>
      {unsent > 0 ? (
        <Typography sx={{ mb: 1 }}>
          There are still {unsent} completions to this course that have not been sent to SIS. Those will be deleted as
          well.
        </Typography>
      ) : null}
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          data-cy="confirm-course-deletion-button"
          disabled={pending}
          onClick={() => {
            onConfirm()
            close()
          }}
        >
          Yes, delete the course
        </Button>
      </Stack>
    </>
  )
}

export default ({ course }) => {
  const dispatch = useDispatch()

  return (
    <RowActions>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" size="small" data-cy={`${course.courseCode}-edit-button`} onClick={open}>
            Edit
          </Button>
        )}
      >
        {(close) => <EditCourseForm course={course} close={close} />}
      </FormDialog>
      <ConfirmPopover
        onOpen={() => dispatch(confirmDeletionAction(course.id))}
        trigger={(open) => (
          <Button variant="contained" size="small" color="error" data-cy="delete-course-button" onClick={open}>
            Delete
          </Button>
        )}
      >
        {(close) => <DeleteConfirm close={close} onConfirm={() => dispatch(deleteCourseAction(course.id))} />}
      </ConfirmPopover>
    </RowActions>
  )
}
