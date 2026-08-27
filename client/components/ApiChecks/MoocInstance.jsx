import { Card } from '@mui/material'
import { useSelector } from 'react-redux'

export default () => {
  const { mooc } = useSelector((state) => state.apiChecks)

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const getCardRow = (instance, attribute) => (
    <div key={attribute}>
      <b>{attribute}: </b>
      {formatValue(instance[attribute])}
    </div>
  )

  const getEnrollments = () => {
    if (!mooc) return ''
    if (mooc && !mooc.length && !mooc.error) return 'The course has no completions'
    if (mooc.error || !Array.isArray(mooc)) return 'Something went wrong'

    return (
      <Card variant="outlined" sx={{ padding: '20px' }}>
        {mooc.map((s) => (
          <div key={s.id}>
            {Object.keys(s).map((attribute) => getCardRow(s, attribute))}
            ------------------------
          </div>
        ))}
      </Card>
    )
  }

  return <div>{getEnrollments()}</div>
}
