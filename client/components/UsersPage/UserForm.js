import React, { useState, useEffect } from 'react'
import {
  Form,
  Checkbox,
  Input,
  Segment,
  Button,
  Message
} from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import * as _ from 'lodash'

import { fetchUser, createUser } from 'Utilities/redux/usersReducer'
import { isValidEmailAddress } from 'Root/utils/validators'

const INITIAL_FORM_DATA = {
  email: '',
  uid: '',
  employeeId: '',
  name: '',
  isGrader: false,
  isAdmin: false,
  courses: [],
  errors: {}
}

const styles = {
  field: { margin: '.5rem 0rem' }
}

const parseUser = (fetchedUser) => ({
  email: fetchedUser.primaryEmail || '',
  uid: fetchedUser.eduPersonPrincipalName ? fetchedUser.eduPersonPrincipalName.split("@")[0] : '',
  employeeId: fetchedUser.employeeNumber || '',
  name: (fetchedUser.firstNames || fetchedUser.lastName) ? `${fetchedUser.firstNames} ${fetchedUser.lastName}` : ''
})


export default ({ close }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })
  const [message, setMessage] = useState('')
  const data = useSelector((state) => state.users)
  const courses = useSelector((state) => state.courses.data)

  useEffect(() => {
    if (data.error) setMessage(data.fetchedUser.error)
    if (!data.error && !data.pending)
      setFormData({ ...formData, ...parseUser(data.fetchedUser) })
  }, [data])

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  const validate = () => (
    (formData.email && isValidEmailAddress(formData.email)) &&
    formData.employeeId && formData.uid && formData.name
  )

  const handleSubmit = () => {
    dispatch(createUser(formData))
    close()
  }

  const handleFetchUser = () => dispatch(fetchUser(formData))

  const courseOptions = _.sortBy(courses, 'name').map((course) => ({
    key: course.id,
    value: course.id,
    text: course.name
  }))

  return (
    <Segment style={{ width: '50em' }}>
      {message ? <Message error>
        <Message.Header>Failed to fetch user</Message.Header>
        <p>{message}</p>
      </Message> : null}

      <Form width={4} loading={data.pending}>
        <Form.Field
          style={styles.field}
          data-cy="add-email-name"
          control={Input}
          label="Email"
          placeholder="Email"
          value={formData.email}
          onChange={handleFieldChange}
          error={false}
          name="email"
          error={formData.email && !isValidEmailAddress(formData.email)}
          required
        />
        <Form.Field
          style={styles.field}
          data-cy="add-user-id-name"
          control={Input}
          label="AD account"
          placeholder="mluukkai"
          value={formData.uid}
          onChange={handleFieldChange}
          error={false}
          name="uid"
          required
        />
        <Form.Field
          style={styles.field}
          data-cy="add-employee-name"
          control={Input}
          label="Employee number"
          placeholder="Employee number"
          value={formData.employeeId}
          onChange={handleFieldChange}
          error={false}
          name="employeeId"
          required
        />
        <Form.Field
          style={styles.field}
          data-cy="add-user-name"
          control={Input}
          label="Full name"
          placeholder="Name"
          value={formData.name}
          onChange={handleFieldChange}
          error={false}
          name="name"
          required
        />
        <Form.Field
          style={styles.field}
          control={Checkbox}
          label="Is grader"
          checked={formData.isGrader}
          onChange={(e, d) => {
            setFormData({ ...formData, isGrader: d.checked })
          }}
        />
        <Form.Field
          control={Checkbox}
          label="Is admin"
          checked={formData.isAdmin}
          onChange={(e, d) => {
            setFormData({ ...formData, isAdmin: d.checked })
          }}
        />
        <Form.Dropdown
          data-cy="add-course"
          search
          label="Add courses for user (optional)"
          options={courseOptions}
          value={data.courses}
          onChange={(e, d) => setFormData({ ...formData, courses: d.value })}
          multiple
          selection
        />
        <Form.Field
          style={styles.field}
          data-cy="add-user-fetch"
          control={Button}
          content="Fetch user details"
          onClick={handleFetchUser}
          disabled={!(formData.uid || formData.email || formData.employeeId)}
          icon="refresh"
          color="blue"
          basic
        />
        <Form.Group>
          <Form.Field
            negative
            control={Button}
            content="Cancel"
            onClick={close}
          />
          <Form.Field
            data-cy="add-user-confirm"
            positive
            control={Button}
            content="Add user"
            disabled={!validate() || data.pending}
            onClick={handleSubmit}
          />
        </Form.Group>
      </Form>
    </Segment>
  )
}
