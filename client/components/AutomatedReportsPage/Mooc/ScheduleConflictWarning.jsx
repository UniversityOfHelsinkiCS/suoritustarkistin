import { Alert } from '@mui/material'
import { firstFreeMinute, runTimes, scheduleGap } from '@shared/cronSchedule'
import { useSelector } from 'react-redux'

const MINIMUM_GAP_MINUTES = 5

export default ({ schedule, jobId }) => {
  const jobs = useSelector((state) => state.moocJobs.data)
  const courses = useSelector((state) => state.courses.data)
  const minimumGap = MINIMUM_GAP_MINUTES * 60

  if (!jobs || !courses) return null

  const otherJobs = jobs.filter((job) => job.active && job.id !== jobId)
  const conflicts = otherJobs
    .map((job) => ({ job, gap: scheduleGap(schedule, job.schedule) }))
    .filter(({ gap }) => gap !== null && gap < minimumGap)

  if (!conflicts.length) return null

  const occupied = otherJobs.flatMap((job) => runTimes(job.schedule) || [])
  const free = firstFreeMinute(occupied, minimumGap)
  const suggestion = free === null ? null : `${(free / 60) % 60} ${Math.floor(free / 3600)} * * *`

  const listed = conflicts
    .slice(0, 2)
    .map(({ job }) => `${job.schedule} (${courses.find((course) => course.id === job.courseId)?.courseCode})`)
    .join(', ')
  const rest = conflicts.length - 2

  return (
    <Alert data-cy="job-schedule-conflict" severity="warning">
      <div>
        Runs less than 5 minutes apart from: {listed}
        {rest > 0 && ` and ${rest} other job${rest === 1 ? '' : 's'}`}
      </div>
      {suggestion && <div>First available timeslot: {suggestion}</div>}
    </Alert>
  )
}
