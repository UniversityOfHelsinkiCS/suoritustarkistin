import React, { useState } from 'react'
import { Button, Header, Modal, Popup, Segment } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import { sendNewReportAction } from 'Utilities/redux/newReportReducer'
import { isValidReport } from 'Root/utils/validators'

const parseReport = (report) => {
  if (!report.data) return report

  return {
    ...report,
    data: report.data.map((row) => {
      if (row.registration) {
        return {
          ...row,
          studentId: row.registration.onro,
          registration: undefined
        }
      }
      return row
    }),
    sending: undefined,
    rawData: undefined
  }
}


export default () => {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)
  const newReport = useSelector((state) => state.newReport)
  const courses = useSelector((state) => state.courses.data)

  if (!courses) return null

  const course = courses.find((c) => c.id === newReport.courseId)

  const closeModal = () => setShowForm(false)

  const sendReport = () => {
    dispatch(sendNewReportAction(parseReport(newReport)))
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
            {newReport.data ? newReport.data.length : 0} completion(s) will be reported for the course:
          </Header>
          <Header size="large">
            {course
              ? `${course.courseCode}: ${course.name}`
              : <span style={{ color:"grey" }}>No course chosen yet</span>
            }
          </Header>
          <div style={{ marginTop: "2em" }}>
            <Button
              size="large"
              data-cy="confirm-sending-button"
              color="green"
              onClick={sendReport}
            >
              Create report
            </Button>
            <Button
              size="large"
              onClick={closeModal}
            >
              Cancel
            </Button>
          </div>
        </Segment>

        </Modal.Content>
      </Modal>
      <Popup
        trigger={
          <span style={{ float: 'right' }}>
            <Button
              positive
              data-cy="create-report-button"
              onClick={() => setShowForm(true)}
              disabled={
                newReport.sending || !isValidReport(parseReport(newReport))
              }
              content="Send report"
            />
          </span>
        }
        content="Report contains validation errors, see table below."
        disabled={!newReport.data || isValidReport(parseReport(newReport))}
        style={{ color: 'red' }}
      />
  </>
  )
}
