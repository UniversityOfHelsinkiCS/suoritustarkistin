import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as _ from 'lodash'
import { Button, Checkbox, Form, Input, Segment } from 'semantic-ui-react'

import { editJobAction } from 'Utilities/redux/moocJobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'

export default ({ job, close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const [data, setData] = useState(job || { active: false, useManualCompletionDate: false })

  if (!data.courseId || !courses) return null

  const course = courses.find((c) => c.id === data.courseId)

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
          required
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
          required
          label="Course"
          options={courses.map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`
          }))}
          value={data.courseId || null}
          onChange={(e, d) => setData({ ...data, courseId: d.value })}
        />
        <Form.Dropdown
          required
          label="Grader"
          search
          selection
          options={_.sortBy(course.graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          onChange={(e, { value }) => setData({ ...data, graderId: value })}
          data-cy="edit-job-grader"
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
        <Form.Field
          data-cy="edit-job-completion-date"
          control={Checkbox}
          label="Use completion date, not registration attempt date"
          checked={data.useManualCompletionDate}
          onChange={(e, d) => setData({ ...data, useManualCompletionDate: d.checked })}
        />
        <Form.Group>
          <Form.Field negative control={Button} content="Cancel" onClick={() => close()} />
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
