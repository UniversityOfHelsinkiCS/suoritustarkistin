import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import NewCourseForm from './NewCourseForm'
import Course from './Course'
import { Segment } from 'semantic-ui-react'

export default () => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)

  useEffect(() => {
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [])

  return (
    <>
      <Segment>
        <NewCourseForm />
      </Segment>
      <Segment>
        {courses.map((c) => (
          <Course course={c} />
        ))}
      </Segment>
    </>
  )
}
