import React, { useState } from 'react'
import CourseInfo from './CourseInfo'
import EditCourseForm from './EditCourseForm'

export default ({ course }) => {
  const [editMode, setEditMode] = useState(false)

  return (
    <>
      {editMode ? (
        <EditCourseForm course={course} setEditMode={setEditMode} />
      ) : (
        <CourseInfo course={course} setEditMode={setEditMode} />
      )}
    </>
  )
}
