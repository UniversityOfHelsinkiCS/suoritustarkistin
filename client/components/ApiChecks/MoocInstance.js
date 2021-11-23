import React from 'react'
import { useSelector } from 'react-redux'
import { Card } from 'semantic-ui-react'


export default () => {
  const { mooc } = useSelector((state) => state.apiChecks)

  const getCardRow = (instance, attribute) => (
    <div>
      <b>{attribute}: </b>{instance[attribute] ? instance[attribute] : 'null'}
    </div>
  )
  
  const getEnrollments = () => {
    if (!mooc || !mooc.length) return 'The course has no completions'

    return (
      <div>
        {mooc.map((s) => (
          <div>
            {getCardRow(s, 'user_upstream_id')}
            {getCardRow(s, 'email')}
            {getCardRow(s, 'student_number')}
            {getCardRow(s, 'completion_date')}
            {getCardRow(s, 'completion_registration_attempt_date')}
            {getCardRow(s, 'completion_language')}
            {getCardRow(s, 'grade')}
            {getCardRow(s, 'tier')}
            {getCardRow(s, 'created_at')}
            {getCardRow(s, 'updated_at')}
            ------------------------
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card style={{ width: '1000px', padding: '20px' }}>
      {getEnrollments()}
    </Card>
  )
}