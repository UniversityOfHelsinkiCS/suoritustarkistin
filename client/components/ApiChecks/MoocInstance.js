import React from 'react'
import { useSelector } from 'react-redux'
import { Card } from 'semantic-ui-react'

export default () => {
  const { mooc } = useSelector((state) => state.apiChecks)

  const getCardRow = (instance, attribute) => (
    <div>
      <b>{attribute}: </b>
      {instance[attribute] ? instance[attribute] : 'null'}
    </div>
  )

  const getEnrollments = () => {
    if (!mooc) return ''
    if (mooc && !mooc.length && !mooc.error) return 'The course has no completions'
    if (mooc.error || !Array.isArray(mooc)) return 'Something went wrong'

    return (
      <Card fluid style={{ padding: '20px' }}>
        {mooc.map((s) => (
          <div key={s.id}>
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
      </Card>
    )
  }

  return <div>{getEnrollments()}</div>
}
