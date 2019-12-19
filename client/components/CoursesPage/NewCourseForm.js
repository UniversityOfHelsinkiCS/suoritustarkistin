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
import { addCourseAction } from 'Utilities/redux/coursesReducer'
import {
  isValidCourse,
  isValidOpenCourseCode,
  isValidHYCourseCode,
  isValidCourseCode,
  isValidCreditAmount,
  isValidLanguage
} from 'Root/utils/validators'

export default ({ close }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState({ isMooc: false, autoSeparate: false })

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addCourseAction(data))
    setData({ isMooc: false, autoSeparate: false })
    close()
  }

  const hasValidCourseCode = (code) => {
    if (data.autoSeparate) return isValidHYCourseCode(code)
    if (data.isMooc) return isValidOpenCourseCode(code)
    return isValidCourseCode(code)
  }

  return (
    <Segment style={{ width: '50em' }}>
      <Form width={4}>
        <Form.Field
          required={true}
          control={Input}
          label="Course name"
          placeholder="Kurssin luomisen perusteet"
          value={data.name || ''}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          error={false}
          icon={data.name ? 'check' : 'times'}
        />
        <Form.Field
          required={true}
          control={Input}
          label="Course code"
          placeholder="TKT00000"
          value={data.courseCode || ''}
          onChange={(e) => setData({ ...data, courseCode: e.target.value })}
          icon={hasValidCourseCode(data.courseCode) ? 'check' : 'times'}
        />
        <Form.Field
          required={true}
          control={Input}
          label="Language"
          placeholder="fi"
          value={data.language || ''}
          onChange={(e) => setData({ ...data, language: e.target.value })}
          icon={isValidLanguage(data.language) ? 'check' : 'times'}
        />
        <Form.Field
          required={true}
          control={Input}
          label="Credit amount"
          placeholder="5,0"
          value={data.credits || ''}
          onChange={(e) => setData({ ...data, credits: e.target.value })}
          icon={isValidCreditAmount(data.credits) ? 'check' : 'times'}
        />
        <Form.Dropdown
          selection
          required={true}
          label="Grader"
          options={graders.map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          value={data.graderId || ''}
          onChange={(e, d) => setData({ ...data, graderId: d.value })}
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
