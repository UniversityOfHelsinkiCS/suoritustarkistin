import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAllCoursesAction } from '@client/utils/redux/coursesReducer'
import { getAllGradersAction } from '@client/utils/redux/gradersReducer'
import NewCourse from '@client/components/CoursesPage/NewCourse'
import Message from '@client/components/Message'
import CourseTable from '@client/components/CoursesPage/CourseTable'

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
