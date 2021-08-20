import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import * as _ from 'lodash'
import {
  Form,
  Checkbox,
  Input,
  Button,
  Popup,
  Segment
} from 'semantic-ui-react'
import { addCourseAction, getResponsiblesAction, resetResponsibles } from 'Utilities/redux/coursesReducer'
import {
  isValidCourse,
  isValidComboCourseCode,
  isValidCourseCode,
  isValidCreditAmount,
  isValidLanguage
} from 'Root/utils/validators'
import { gradeScales } from 'Root/utils/common'

export default ({ close: closeModal }) => {
  const dispatch = useDispatch()
  const graders = useSelector((state) => state.graders.data)
  const courseData = useSelector((state) => state.courses)
  const [data, setData] = useState({ autoSeparate: false, graders: [] })

  useEffect(() => {
    if (courseData.responsibles && !courseData.pending) {
      const responsibleUids = Object.keys(courseData.responsibles)
        .filter((r) => courseData.responsibles[r].person.eduPersonPrincipalName)
        .map((r) => courseData.responsibles[r].person.eduPersonPrincipalName.split("@")[0])
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
    setData({ isMooc: false, autoSeparate: false })
    close()
  }

  const hasValidCourseCode = (code) => {
    if (data.autoSeparate) return isValidComboCourseCode(code)
    return isValidCourseCode(code)
  }

  return (
    <Segment style={{ width: '50em' }}>
      <Form width={4} loading={courseData.pending}>
        <Form.Field
          data-cy="add-course-name"
          required={true}
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
          required={true}
          control={Input}
          label="Course code"
          placeholder="TKT00000"
          value={data.courseCode || ''}
          onChange={(e) => setData({ ...data, courseCode: e.target.value })}
          icon={hasValidCourseCode(data.courseCode) ? 'check' : 'times'}
        />
        <p style={{ color: "gray" }}>When editing a combocourse, add the coursecode in format "AYTKTxxxxx + TKTxxxxx". AY-coded should be first.</p>
        <Form.Field
          data-cy="add-course-language"
          required={true}
          control={Input}
          label="Language"
          placeholder="fi"
          value={data.language || ''}
          onChange={(e) => setData({ ...data, language: e.target.value })}
          icon={isValidLanguage(data.language) ? 'check' : 'times'}
        />
        <Form.Field
          data-cy="add-course-credits"
          required={true}
          control={Input}
          label="Credit amount"
          placeholder="5,0"
          value={data.credits || ''}
          onChange={(e) => setData({ ...data, credits: e.target.value })}
          icon={isValidCreditAmount(data.credits) ? 'check' : 'times'}
        />
        <Form.Dropdown
          label="Grade scale"
          selection
          options={gradeScales}
          value={data.gradeScale}
          onChange={(e, { value }) => setData({ ...data, gradeScale: value })}
        />
        <Form.Dropdown
          data-cy="add-course-grader"
          search
          required={true}
          label="Grader"
          multiple
          selection
          options={_.sortBy(graders, 'name').map((grader) => ({
            key: grader.id,
            value: grader.id,
            text: grader.name
          }))}
          value={data.graders}
          onChange={(e, d) => setData({ ...data, graders: d.value })}
        />
        <Form.Field
          data-cy="fetch-graders"
          control={Button}
          disabled={!hasValidCourseCode(data.courseCode)}
          onClick={() => dispatch(getResponsiblesAction(data.courseCode))}
          content="Fetch course graders"
          icon="refresh"
          color="blue"
          basic
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
          content={`
            Enables automatic detection of HY and Open university students 
            when both courses are held simultaneously. Requires MOOC-bit to be set in Open university systems.
          `}
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
