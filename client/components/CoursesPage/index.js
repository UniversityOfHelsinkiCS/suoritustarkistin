import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import NewCourse from 'Components/CoursesPage/NewCourse'
import Message from 'Components/Message'
import CourseTable from 'Components/CoursesPage/CourseTable'


export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [])

  return (
    <>
      <Message />
      <NewCourse />
      <CourseTable />
    </>
  )
}
