import JobActions from '@client/components/AutomatedReportsPage/Mooc/JobActions'
import DataTable, { BooleanIcon } from '@client/components/DataTable'
import { useSelector } from 'react-redux'

const columns = [
  { key: 'schedule', header: 'Schedule', width: '8%', sortable: true },
  { key: 'courseCode', header: 'Course code', width: '8%', sortable: true },
  { key: 'courseName', header: 'Course name', width: '20%', sortable: true },
  { key: 'graderName', header: 'Grader', width: '12%', sortable: true },
  { key: 'slug', header: 'Slug', width: '12%', sortable: true },
  {
    key: 'active',
    header: 'Active',
    width: '8%',
    align: 'center',
    sortable: true,
    render: (job) => <BooleanIcon value={job.active} />
  },
  {
    key: 'useManualCompletionDate',
    header: 'Use manual completion date',
    width: '8%',
    align: 'center',
    sortable: true,
    render: (job) => <BooleanIcon value={job.useManualCompletionDate} />
  },
  { key: 'actions', header: 'Actions', width: '18%', align: 'center', render: (job) => <JobActions job={job} /> }
]

export default () => {
  const jobs = useSelector((state) => state.moocJobs.data)
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)

  const rows = jobs.map((job) => {
    const course = courses.find((c) => c.id === job.courseId)
    return {
      ...job,
      courseCode: course?.courseCode,
      courseName: course?.name,
      graderName: graders.find((grader) => grader.id === job.graderId)?.name
    }
  })

  return (
    <DataTable
      data-cy="mooc-job-table"
      columns={columns}
      rows={rows}
      rowKey={(job) => job.id}
      rowProps={(job) => ({ 'data-cy': `job-${job.courseCode}` })}
      defaultSort={[
        { key: 'active', direction: 'desc' },
        { key: 'courseName', direction: 'asc' }
      ]}
    />
  )
}
