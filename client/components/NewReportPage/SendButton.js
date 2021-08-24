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

export default () => {
  const [showForm, setShowForm] = useState(false)
  const dispatch = useDispatch()
  const newRawEntries = useSelector((state) => state.newRawEntries)
  const courses = useSelector((state) => state.courses.data)

  const closeModal = () => setShowForm(false)

  if (!courses) return null

  const course = courses.find((c) => c.id === newRawEntries.courseId)

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
        <Segment style={{ height: "15em", textAlign: "center", padding: "2em"}}>
          <Header size="large">
            {newRawEntries.data ? newRawEntries.data.length : 0} completion(s) will be reported for the course:
          </Header>
          <Header size="large">
            {course
              ? `${course.courseCode}: ${course.name}`
              : <span style={{ color:"grey" }}>No course chosen yet</span>
            }
          </Header>
          <div style={{ marginTop: "2em" }}>
            <Button
              data-cy="confirm-sending-button"
              color="green"
              onClick={sendRawEntries}
            >
            Create report
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
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