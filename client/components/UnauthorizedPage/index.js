/* eslint-disable react/no-unescaped-entities */
import React from 'react'
import { useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { Message, Segment } from 'semantic-ui-react'

export default () => {
  const user = useSelector((state) => state.user)

  // Mainly for development purposes:
  if (user.data.isAdmin || user.data.isGrader) {
    return (
      <Redirect
        to={{
          pathname: '/',
          state: {
            from: '/unauthorized'
          }
        }}
      />
    )
  }

  return (
    <Segment>
      <Message error>
        Your account has been created. Before you can start using the service, your account must be approved manually by
        one of SUOTAR's administrators.
        <br />
        <br />
        To get your account approved, you must send an email{' '}
        <span style={{ fontWeight: 'bold' }}>(including the details of the course you want to grade)</span> to{' '}
        <a target="_blank" rel="noopener noreferrer" href="mailto:grp-toska@helsinki.fi">
          grp-toska@helsinki.fi
        </a>
      </Message>
    </Segment>
  )
}
