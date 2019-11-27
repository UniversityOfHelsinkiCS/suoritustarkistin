import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import NewCourseForm from './NewCourseForm'

export default () => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)

  useEffect(() => {
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [])

  return (
    <>
      <NewCourseForm />
      {courses.map((c) => (
        <p>{c.name}</p>
      ))}
    </>
  )
}
