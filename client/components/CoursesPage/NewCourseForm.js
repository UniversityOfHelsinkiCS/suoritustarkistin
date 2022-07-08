import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as _ from 'lodash'
import { Button, Form, Input, Segment, Popup, Icon, Checkbox } from 'semantic-ui-react'
import { addCourseAction, getResponsiblesAction, resetResponsibles } from 'Utilities/redux/coursesReducer'
import { isValidCourse, isValidCourseCode, isValidCreditAmount, isValidLanguage } from 'Root/utils/validators'
import { gradeScales } from 'Root/utils/common'

const Help = ({ text }) => (
  <span style={{ marginLeft: '7px' }}>
    <Popup content={text} trigger={<Icon name="help" circular />} />
  </span>
)

export default ({ close: closeModal }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const courseData = useSelector((state) => state.courses)
  const [data, setData] = useState({ graders: [], useAsExtra: false })

  useEffect(() => {
    if (courseData.responsibles && !courseData.pending) {
      const responsibleUids = Object.keys(courseData.responsibles)
        .filter((r) => courseData.responsibles[r].person.eduPersonPrincipalName)
        .map((r) => courseData.responsibles[r].person.eduPersonPrincipalName.split('@')[0])
      const newGraders = graders.filter((g) => responsibleUids.includes(g.uid)).map(({ id }) => id)
      const updatedGraders = _.uniq(data.graders.concat(newGraders))
      setData({ ...data, graders: updatedGraders })
    }
  }, [courseData])

  const close = () => {
    dispatch(resetResponsibles())
    closeModal()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    dispatch(addCourseAction(data))
    close()
  }

  return (
    <Segment style={{ width: '50em' }}>
      <Form width={4} loading={courseData.pending}>
        <Form.Field
          data-cy="add-course-name"
          required
          control={Input}
          label="Course name"
          placeholder="Basics of creating a course"
          value={data.name || ''}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          error={false}
          icon={data.name ? 'check' : 'times'}
        />
        <Form.Field
          data-cy="add-course-code"
          required
          control={Input}
          label="Course code"
          placeholder="TKT00000"
          value={data.courseCode || ''}
          onChange={(e) => setData({ ...data, courseCode: e.target.value })}
          icon={isValidCourseCode(data.courseCode) ? 'check' : 'times'}
        />
        <Form.Field
          data-cy="add-course-language"
          required
          control={Input}
          label="Language"
          placeholder="fi"
          value={data.language || ''}
          onChange={(e) => setData({ ...data, language: e.target.value })}
          icon={isValidLanguage(data.language) ? 'check' : 'times'}
        />
        <Form.Field
          data-cy="add-course-credits"
          required
          control={Input}
          label="Credit amount"
          placeholder="5,0"
          value={data.credits || ''}
          onChange={(e) => setData({ ...data, credits: e.target.value })}
          icon={isValidCreditAmount(data.credits) ? 'check' : 'times'}
        />
        <Form.Dropdown
          data-cy="add-course-grade-scale"
          label="Grade scale"
          selection
          options={gradeScales}
          value={data.gradeScale}
          onChange={(e, { value }) => setData({ ...data, gradeScale: value })}
        />
        <Form.Dropdown
          data-cy="add-course-grader"
          label="Grader"
          options={_.sortBy(graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          value={data.graders}
          onChange={(e, d) => setData({ ...data, graders: d.value })}
          search
          multiple
          selection
        />
        <Form.Field
          data-cy="fetch-graders"
          control={Button}
          disabled={!isValidCourseCode(data.courseCode)}
          onClick={() => dispatch(getResponsiblesAction(data.courseCode))}
          content="Fetch course graders"
          icon="refresh"
          color="blue"
          basic
        />
        <Form.Field
          label={
            <label>
              Use as erilliskirjaus
                <Help text='Select this only if course is used as "erilliskirjaus" together with bachelors thesis' />
            </label>
          }
          control={Checkbox}
          value={data.useAsExtra}
          onChange={(e, d) => setData({ ...data, useAsExtra: d.checked })}
        />
        <Form.Group>
          <Form.Field negative control={Button} content="Cancel" onClick={() => close()} />
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
