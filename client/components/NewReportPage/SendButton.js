import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Header, Modal, Popup, Segment } from 'semantic-ui-react'
import { sendNewRawEntriesAction } from 'Utilities/redux/newRawEntriesReducer'
import { areValidNewRawEntries } from 'Root/utils/validators'

const parseRawEntries = (rawEntries) => {
  if (!rawEntries.data) return rawEntries

  const defaultGrade = rawEntries.defaultGrade
  return {
    ...rawEntries,
    data: rawEntries.data.map((row) => {
      if (row.registration && !row.grade) {
        return {
          ...row,
          grade: defaultGrade ? 'Hyv.' : null,
          studentId: row.registration.onro,
          registration: undefined
        }
      }
      if (!row.grade && defaultGrade) {
        return {
          ...row,
          grade: 'Hyv.'
        }
      }
      return row
    }),
    sending: undefined,
    rawData: undefined
  }
}

const parseCourseName = (newRawEntries, defaultCourse, courses) => {
  if (!newRawEntries.data || !courses) return <></>

  let rowCourses = []
  newRawEntries.data.forEach((row) => {
    const course = courses.find((c) => c.courseCode === row.course)
    if (course) rowCourses = [...rowCourses, course]
    else if (defaultCourse) rowCourses = [...rowCourses, defaultCourse]
  })

  const amounts = _.countBy(rowCourses, 'courseCode')

  if (rowCourses.length) {
    return (
      <>
        {_.uniq(rowCourses).map((c) => <p key={c.name}>{`${amounts[c.courseCode]} x ${c.name} (${c.courseCode})`}</p>)}
      </>
    )
  }

  return (
    <span>No courses chosen yet</span>
  )
}

export default () => {
  const [showForm, setShowForm] = useState(false)
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)

  const closeModal = () => setShowForm(false)

  if (!courses) return null

  const defaultCourse = courses.find((c) => c.id === newRawEntries.courseId)

  const sendRawEntries = () => {
    dispatch(sendNewRawEntriesAction(parseRawEntries(newRawEntries)))
    closeModal()
  }

  return (
    <>
    <Modal
      basic
      open={showForm}
      onClose={closeModal}
      size="small"
    >
      <Modal.Content >
        <Segment style={{
          display: "flex",
          flexDirection: "column",
          width: "50em",
          textAlign: "center",
          verticalAlign: "center",
          padding: "2em"
        }}>
          <Header size="large">
            Following completion(s) will be reported:
          </Header>
          <Header>
            {parseCourseName(newRawEntries, defaultCourse, courses)}
          </Header>
          <div style={{ marginTop: "2em" }}>
            <Button
              data-cy="confirm-sending-button"
              color="green"
              onClick={sendRawEntries}
            >
              Create report
            </Button>
            <Button
              onClick={closeModal}
              data-cy="cancel-sending-button"
            >
              Cancel
            </Button>
          </div>
        </Segment>

      </Modal.Content>
    </Modal>
    <Popup
      trigger={
        <div style={{ position: "absolute", right: "1em" }}>
          <Button
            positive
            data-cy="create-report-button"
            onClick={() => setShowForm(true)}
            disabled={
              newRawEntries.sending || !areValidNewRawEntries(parseRawEntries(newRawEntries))
            }
            content="Create report"
          />
        </div>
      }
      content={newRawEntries.data && newRawEntries.data.length > 100 ? 'Currently single report can contain max 100 completions' :"Report contains validation errors, see table below."}
      disabled={!newRawEntries.data || areValidNewRawEntries(parseRawEntries(newRawEntries) || newRawEntries.data && newRawEntries.data.length <= 100)}
      style={{ color: 'red' }}
    />
  </>
  )
}