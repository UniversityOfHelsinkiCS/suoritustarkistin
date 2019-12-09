import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Checkbox, Input, Button } from 'semantic-ui-react'
import { editCourseAction } from 'Utilities/redux/coursesReducer'
import {
  isValidCourse,
  isValidOpenCourseCode,
  isValidHYCourseCode,
  isValidCourseCode,
  isValidCreditAmount,
  isValidLanguage
} from 'Root/utils/validators'

export default ({ course, setEditMode }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const [data, setData] = useState(
    course || { isMooc: false, autoSeparate: false }
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(editCourseAction(data))
  }

  const hasValidCourseCode = (code) => {
    if (data.autoSeparate) return isValidHYCourseCode(code)
    if (data.isMooc) return isValidOpenCourseCode(code)
    return isValidCourseCode(code)
  }

  return (
    <Form>
      <Form.Field
        required={true}
        control={Input}
        label="Course name"
        placeholder="Kurssin luomisen perusteet"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        error={false}
        icon={data.name ? 'check' : 'times'}
      />
      <Form.Field
        required={true}
        control={Input}
        label="Course code"
        placeholder="TKT00000"
        value={data.courseCode}
        onChange={(e) => setData({ ...data, courseCode: e.target.value })}
        icon={hasValidCourseCode(data.courseCode) ? 'check' : 'times'}
      />
      <Form.Field
        required={true}
        control={Input}
        label="Language"
        placeholder="fi"
        value={data.language}
        onChange={(e) => setData({ ...data, language: e.target.value })}
        icon={isValidLanguage(data.language) ? 'check' : 'times'}
      />
      <Form.Field
        required={true}
        control={Input}
        label="Credit amount"
        placeholder="5,0"
        value={data.credits}
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
        value={data.graderId}
        onChange={(e, d) => setData({ ...data, graderId: d.value })}
      />
      <Form.Field
        control={Checkbox}
        label="Email identification"
        checked={data.isMooc}
        onChange={(e, d) => {
          setData({ ...data, isMooc: d.checked })
        }}
      />
      <Form.Field
        control={Checkbox}
        label="Combined (TKT + AYTKT) course"
        checked={data.autoSeparate}
        onChange={(e, d) => setData({ ...data, autoSeparate: d.checked })}
      />
      <Form.Group>
        <Form.Field
          negative
          control={Button}
          content="Cancel"
          onClick={() => setEditMode(false)}
        />
        <Form.Field
          positive
          control={Button}
          content="Save"
          disabled={!isValidCourse(data)}
          onClick={handleSubmit}
        />
      </Form.Group>
    </Form>
  )
}
