import React from 'react'
import { useSelector } from 'react-redux'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import * as _ from 'lodash'

import CourseRow from '@client/components/CoursesPage/CourseRow'

// Semantic laid this out as a 16-column celled Grid; the widths are carried over as
// percentages so the columns keep their proportions.
export const columnWidths = ['18.75%', '12.5%', '6.25%', '6.25%', '18.75%', '12.5%', '6.25%', '6.25%', '12.5%']

const headers = [
  'Name',
  'Course code',
  'Language',
  'Credit amount',
  'Graders',
  'Grade scale',
  'Extra completions',
  'New Mooc Course',
  ''
]

export default () => {
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)

  if (!courses) return null

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table size="small" sx={{ tableLayout: 'fixed', wordWrap: 'anywhere' }}>
        <TableHead>
          <TableRow>
            {headers.map((header, i) => (
              <TableCell key={header || 'actions'} sx={{ width: columnWidths[i], fontWeight: 700 }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {_.sortBy(courses, 'name').map((c) => (
            <CourseRow course={c} graders={graders} key={c.id} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
