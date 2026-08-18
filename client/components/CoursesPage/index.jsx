import CourseTable from '@client/components/CoursesPage/CourseTable'
import NewCourse from '@client/components/CoursesPage/NewCourse'
import Message from '@client/components/Message'
import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { getAllGradersAction } from '@client/utils/redux/gradersReducer'
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
      <Message />
      <NewCourse />
      <CourseTable />
    </>
  )
}
