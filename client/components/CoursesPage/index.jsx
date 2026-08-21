import CourseTable from '@client/components/CoursesPage/CourseTable'
import NewCourseForm from '@client/components/CoursesPage/NewCourseForm'
import FormDialog from '@client/components/FormDialog'
import Message from '@client/components/Message'
import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { getAllGradersAction } from '@client/utils/redux/gradersReducer'
import { Button } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [dispatch])

  return (
    <>
      <FormDialog
        trigger={(open) => (
          <Button variant="contained" color="success" data-cy="add-course-button" onClick={open}>
            Add new course
          </Button>
        )}
      >
        {(close) => <NewCourseForm close={close} />}
      </FormDialog>
      <Message />
      <CourseTable />
    </>
  )
}
