import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Checkbox } from 'semantic-ui-react'
import { addCourseAction } from 'Utilities/redux/coursesReducer'

export default () => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)

  const handleSubmit = (event) => {
    event.preventDefault()

    //dispatch(addCourseAction(data))
  }

  return (
    <Form>
      <Form.Field
        type="text"
        label="Course name"
        name="name"
        placeholder="Kurssin luomisen perusteet"
      />
      <Form.Field
        type="text"
        label="Course code"
        name="code"
        placeholder="TKT00000"
      />
      <Form.Field
        type="text"
        label="Language"
        name="language"
        placeholder="fi"
      />
      <Form.field
        type="text"
        label="Credit amount"
        name="credits"
        placeholder="5,0"
      />
      <Form.Select label="Grader" name="grader" options={[]} />
      <Form.Field control={Checkbox} label="MOOC course" name="mooc" />
    </Form>
  )
}
