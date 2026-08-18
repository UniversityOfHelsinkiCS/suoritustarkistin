import DeletionModal from '@client/components/CoursesPage/DeletionModal'
import EditCourse from '@client/components/CoursesPage/EditCourse'
import { confirmDeletionAction } from '@client/utils/redux/coursesReducer'
import CheckIcon from '@mui/icons-material/Check'
import { Button, TableCell, TableRow } from '@mui/material'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

export default ({ course, graders }) => {
  const [showForm, setShowForm] = useState(false)
  const dispatch = useDispatch()
  const getGradersNames = () => {
    if (!graders || !course.graders) return null
    const courseGraders = course.graders.map((grader) => grader.name)
    return courseGraders ? courseGraders.join(', ') : null
  }

  const confirmDeletion = async (id) => {
    await dispatch(confirmDeletionAction(id))
    setShowForm(true)
  }

  return (
    <TableRow>
      <TableCell>{course.name}</TableCell>
      <TableCell>{course.courseCode}</TableCell>
      <TableCell>{course.language}</TableCell>
      <TableCell>{course.credits}</TableCell>
      <TableCell>{getGradersNames()}</TableCell>
      <TableCell>{course.gradeScale}</TableCell>
      <TableCell align="center">{course.useAsExtra ? <CheckIcon color="success" /> : null}</TableCell>
      <TableCell align="center">{course.isNewMooc ? <CheckIcon color="success" /> : null}</TableCell>
      <TableCell>
        <EditCourse course={course} />
        <Button
          variant="contained"
          color="error"
          data-cy="delete-course-button"
          onClick={() => confirmDeletion(course.id)}
          sx={{ ml: 1 }}
        >
          Delete
        </Button>
        {showForm && <DeletionModal id={course.id} showForm={showForm} setShowForm={setShowForm} />}
      </TableCell>
    </TableRow>
  )
}
