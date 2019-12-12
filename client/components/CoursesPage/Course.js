import React, { useState } from 'react'
import CourseInfo from 'Components/CoursesPage/CourseInfo'
import EditCourseForm from 'Components/CoursesPage/EditCourseForm'

export default ({ course }) => {
  const [editMode, setEditMode] = useState(false)

  return editMode ? (
    <EditCourseForm course={course} setEditMode={setEditMode} />
  ) : (
    <CourseInfo course={course} setEditMode={setEditMode} />
  )
}
