import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Checkbox, Form, Input, Segment } from 'semantic-ui-react'
import * as _ from 'lodash'

import { addJobAction } from 'Utilities/redux/moocJobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'


export default ({ close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState({ active: false })

  if (!courses || !graders) return null

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
          search
          required={true}
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
          required={true}
          label="Grader"
          selection
          search
          options={_.sortBy(graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          onChange={(e, { value }) => setData({ ...data, graderId: value  })}
          data-cy="add-job-grader"
          label="Grader"
          value={data.graderId || null}
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
            data-cy="add-job-confirm"
            positive
            control={Button}
            content="Add Cronjob"
            disabled={!isValidJob(data)}
            onClick={handleSubmit}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}
