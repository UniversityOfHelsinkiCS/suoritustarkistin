import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAllCoursesAction } from 'Utilities/redux/coursesReducer'
import { getAllGradersAction } from 'Utilities/redux/gradersReducer'
import NewCourseForm from 'Components/CoursesPage/NewCourseForm'
import Message from 'Components/Message'
import CourseTable from 'Components/CoursesPage/CourseTable'

import { Segment } from 'semantic-ui-react'

export default () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllCoursesAction())
    dispatch(getAllGradersAction())
  }, [])

  return (
    <>
      <Message />
      <Segment style={{ width: '50em' }}>
        <NewCourseForm />
      </Segment>
      <Segment>
        <CourseTable />
      </Segment>
    </>
  )
}
