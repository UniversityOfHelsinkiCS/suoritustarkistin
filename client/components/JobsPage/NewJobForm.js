import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Checkbox, Input, Button, Segment } from 'semantic-ui-react'
import { addJobAction } from 'Utilities/redux/jobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'
import * as _ from 'lodash'

export default ({ close }) => {
  const dispatch = useDispatch()
  const courses = useSelector((state) => state.courses.data)
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState({ active: false })

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
          options={filterAYCourses(courses).map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`
          }))}
          value={data.courseId || null}
          onChange={(e, d) => setData({ ...data, courseId: d.value })}
        />
        <Form.Field
          data-cy="add-job-grader"
          control={Input}
          label="Grader"
          value={findGraderName()}
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
