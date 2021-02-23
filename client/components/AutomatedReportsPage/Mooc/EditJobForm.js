import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import * as _ from 'lodash'
import { Form, Checkbox, Input, Button, Segment } from 'semantic-ui-react'
import { editJobAction } from 'Utilities/redux/jobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'

export default ({ job, close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState(job || { active: false })

  const findGraderName = () => {
    if (!data.courseId) return null
    const course = courses.find((c) => c.id === data.courseId)
    const grader = graders.find((g) => g.id === course.graderId)
    return grader.name
  }

  const filterAYCourses = (courses) => {
    if (!courses) return []
    const filteredCourses = courses.filter((c) => c.courseCode.substring(0, 2) === 'AY')
    return _.sortBy(filteredCourses, 'name')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(editJobAction(data))
    close()
  }

  return (
    <Segment>
      <Form width={4}>
        <Form.Field
          data-cy="edit-job-schedule"
          required={true}
          control={Input}
          label="Cron schedule"
          placeholder="* * * * *"
          value={data.schedule || ''}
          onChange={(e) => setData({ ...data, schedule: e.target.value })}
          error={false}
          icon={isValidSchedule(data.schedule) ? 'check' : 'times'}
        />
        <Form.Dropdown
          data-cy="edit-job-course"
          selection
          search
          required={true}
          label="Course"
          options={filterAYCourses(courses).map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`
          }))}
          value={data.courseId || null}
          onChange={(e, d) => setData({ ...data, courseId: d.value })}
        />
        <Form.Field
          data-cy="edit-job-grader"
          control={Input}
          label="Grader"
          value={findGraderName()}
        />
        <Form.Field
          data-cy="edit-job-slug"
          required={false}
          control={Input}
          label="Mooc API slug"
          value={data.slug || ''}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
          error={false}
        />
        <Form.Field
          data-cy="edit-job-active"
          control={Checkbox}
          label="Active"
          checked={data.active}
          onChange={(e, d) => setData({ ...data, active: d.checked })}
        />
        <Form.Group>
          <Form.Field
            negative
            control={Button}
            content="Cancel"
            onClick={() => close()}
          />
          <Form.Field
            data-cy="edit-job-confirm"
            positive
            control={Button}
            content="Save"
            disabled={!isValidJob(data)}
            onClick={handleSubmit}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}
