import CourseActions from '@client/components/CoursesPage/CourseActions'
import DataTable, { BooleanIcon } from '@client/components/DataTable'
import { useSelector } from 'react-redux'

const graderNames = (course) => (course.graders || []).map((grader) => grader.name).join(', ')

const columns = [
  { key: 'name', header: 'Name', width: '18.75%', sortable: true },
  { key: 'courseCode', header: 'Course code', width: '9%', sortable: true },
  { key: 'language', header: 'Language', width: '7%', sortable: true },
  { key: 'credits', header: 'Credits', width: '7%', sortable: true },
  { key: 'graders', header: 'Graders', width: '18.75%', sortable: true, sortValue: graderNames, render: graderNames },
  { key: 'gradeScale', header: 'Grade scale', width: '8%', sortable: true },
  {
    key: 'useAsExtra',
    header: 'Extra completions',
    width: '8%',
    align: 'center',
    sortable: true,
    render: (course) => <BooleanIcon value={course.useAsExtra} />
  },
  {
    key: 'isNewMooc',
    header: 'New Mooc Course',
    width: '8%',
    align: 'center',
    sortable: true,
    render: (course) => <BooleanIcon value={course.isNewMooc} />
  },
  {
    key: 'actions',
    header: 'Actions',
    width: '10%',
    align: 'center',
    render: (course) => <CourseActions course={course} />
  }
]

export default () => {
  const courses = useSelector((state) => state.courses.data)

  return (
    <DataTable
      columns={columns}
      rows={courses}
      rowKey={(course) => course.id}
      defaultSort={[{ key: 'name', direction: 'asc' }]}
    />
  )
}
