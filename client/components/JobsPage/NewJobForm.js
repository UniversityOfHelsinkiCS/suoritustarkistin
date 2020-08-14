import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Form,
  Checkbox,
  Input,
  Button,
  Popup,
  Segment
} from 'semantic-ui-react'
import { addJobAction } from 'Utilities/redux/jobsReducer'
import { isValidJob, isValidSchedule } from 'Root/utils/validators'

export default ({ close }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const courses = useSelector((state) => state.courses.data)
  const [data, setData] = useState({ active: false })

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addJobAction(data))
    setData({ active: true })
    close()
  }

  // IS GRADER EVEN NEEDED? COURSES ALREADY HAVE A GRADER!

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
          icon={data.name ? 'check' : 'times'}
        />

        <Form.Dropdown
          data-cy="add-job-course"
          selection
          required={true}
          label="Course"
          options={courses.map((course) => ({
            key: course.id,
            value: course.id,
            text: `${course.name} (${course.courseCode})`
          }))}
          value={data.courseId || ''}
          onChange={(e, d) => setData({ ...data, courseId: d.value })}
        />
        <Popup
          trigger={
            <Form.Field
              control={Checkbox}
              label="Email identification"
              checked={data.isMooc}
              onChange={(e, d) => {
                setData({ ...data, isMooc: d.checked })
              }}
            />
          }
          mouseEnterDelay={300}
          mouseLeaveDelay={500}
          content="Enables creating reports with student email addresses instead of student numbers. Requires MOOC-bit to be set in Open university systems."
        />
        <Popup
          trigger={
            <Form.Field
              control={Checkbox}
              label="Combined (TKT + AYTKT) course"
              checked={data.autoSeparate}
              onChange={(e, d) => setData({ ...data, autoSeparate: d.checked })}
            />
          }
          mouseEnterDelay={300}
          mouseLeaveDelay={500}
          content="Enables automatic detection of HY and Open university students when both courses are held simultaneously. Requires MOOC-bit to be set in Open university systems."
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
            disabled={!isValidCourse(data)}
            onClick={handleSubmit}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}
