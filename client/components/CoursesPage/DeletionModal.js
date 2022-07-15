import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, Header, Modal, Segment } from 'semantic-ui-react'

import { deleteCourseAction } from 'Utilities/redux/coursesReducer'

const DeletionModal = ({ showForm, setShowForm, id }) => {
  const dispatch = useDispatch()
  const unsent = useSelector((state) => state.courses.unsent)
  const closeModal = () => setShowForm(false)

  const deleteCourse = (id) => {
    dispatch(deleteCourseAction(id))
    closeModal()
  }

  return (
    <Modal basic open={showForm} onClose={closeModal} size="small">
      <Modal.Content>
        <Segment style={{ height: '15em', textAlign: 'center', padding: '2em' }}>
          <Header size="large">Are you sure you want to delete the course?</Header>
          <Header>
            {unsent > 0 &&
              `There are still ${unsent} completions to this course that 
                have not been sent to SIS. Those will be deleted as well.`}
          </Header>
          <div style={{ marginTop: '2em' }}>
            <Button data-cy="confirm-course-deletion-button" color="red" onClick={() => deleteCourse(id)}>
              Yes, delete the course {unsent > 0 && 'and unsent completions'}
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </div>
        </Segment>
      </Modal.Content>
    </Modal>
  )
}

export default DeletionModal
