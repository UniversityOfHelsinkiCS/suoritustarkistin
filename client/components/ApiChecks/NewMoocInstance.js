import React from 'react'
import { useSelector } from 'react-redux'
import { Card } from 'semantic-ui-react'

export default () => {
  const { newMooc } = useSelector((state) => state.apiChecks)

  const getCardRow = (instance, attribute) => (
    <div>
      <b>{attribute}: </b>
      {instance[attribute] ? instance[attribute] : 'null'}
    </div>
  )

  const getGradeRow = (instance) => (
    <div>
        <b>grade: </b>
        {instance.grade ? JSON.stringify(instance.grade) : 'null'}
    </div>
  )

  const getEnrollments = () => {
    if (!newMooc) return ''
    if (newMooc && !newMooc.length && !newMooc.error) return 'The course has no completions'
    if (newMooc.error || !Array.isArray(newMooc)) return 'Something went wrong'

    return (
      <Card fluid style={{ padding: '20px' }}>
        {newMooc.map((s) => (
          <div key={s.id}>
            {getCardRow(s, 'user_upstream_id')}
            {getCardRow(s, 'email')}
            {getCardRow(s, 'completion_date')}
            {getCardRow(s, 'completion_registration_attempt_date')}
            {getCardRow(s, 'completion_language')}
            {getGradeRow(s)}
            {getCardRow(s, 'tier')}
            ------------------------
          </div>
        ))}
      </Card>
    )
  }

  return <div>{getEnrollments()}</div>
}
