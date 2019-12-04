import React from 'react'
import { Button } from 'semantic-ui-react'

export default ({ course, setEditMode }) => {
  return (
    <>
      <div>{course.name}</div>
      <div>{course.courseCode}</div>
      <Button onClick={() => setEditMode(true)} content="Edit" />
    </>
  )
}
