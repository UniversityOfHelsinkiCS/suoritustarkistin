import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Checkbox, Input, Button, Segment } from 'semantic-ui-react'
import { addJobAction } from 'Utilities/redux/jobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'

export default ({ close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const [data, setData] = useState({ active: false })

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addJobAction(data))
    setData({ active: true })
    close()
  }

  return (
    <Segment style={{ width: '50em' }}>
      <Form width={4}>
        <Form.Field
          data-cy="add-job-schedule"
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
          data-cy="add-job-course"
          selection
          required={true}
          label="Course"
          options={courses.map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`,
          }))}
          value={data.courseId || ''}
          onChange={(e, d) => setData({ ...data, courseId: d.value })}
        />
        <Form.Field
          control={Input}
          label="Grader"
          value={data.course.grader || ''}
          error={false}
        />
        <Form.Field
          data-cy="add-job-slug"
          required={false}
          control={Input}
          label="Mooc API slug"
          value={data.slug || ''}
          onChange={(e) => setData({ ...data, slug: e.target.value })}
          error={false}
        />
        <Form.Field
          data-cy="add-job-active"
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
            data-cy="add-course-confirm"
            positive
            control={Button}
            content="Add Course"
            disabled={!isValidJob(data)}
            onClick={handleSubmit}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}
