import { Box, Chip } from '@mui/material'
import * as _ from 'lodash'
import moment from 'moment'

const styles = {
  success: {
    marginBottom: '0',
    color: 'green',
    fontWeight: 700
  },
  missing: {
    marginBottom: '0',
    color: 'orange',
    fontWeight: 700
  },
  info: {
    marginBottom: '0',
    marginTop: '2px',
    color: 'rgba(0, 0, 0, 0.6)', // MUI's text.secondary
    fontWeight: 400
  },
  error: {
    marginBottom: '0',
    color: 'red',
    fontWeight: 700
  }
}

const ReportStatus = ({ batch }) => {
  if (!batch) return null

  const sentDate =
    batch.filter(({ entry }) => entry.sent).sort((a, b) => new Date(b.entry.sent) - new Date(a.entry.sent))[0] || null
  const senderNames = batch.filter(({ entry }) => entry.sender).map(({ entry }) => entry.sender.name)
  const formattedDate = moment(sentDate ? sentDate.entry.sent : null).format('DD.MM.YYYY')
  const amountOfErrors = batch.filter(({ entry }) => entry.errors).length
  const missingEnrollments = batch.filter(({ entry }) => entry.missingEnrolment).length

  const getMissingEnrollment = () =>
    missingEnrollments ? (
      <Chip
        size="small"
        variant="outlined"
        color="warning"
        sx={{ ml: 1 }}
        label={`${missingEnrollments} MISSING ENROLLMENT`}
      />
    ) : null

  const getErrorAmount = () =>
    amountOfErrors !== 0 ? (
      <Chip
        size="small"
        variant="outlined"
        color="error"
        sx={{ ml: 1 }}
        label={`CONTAINS ${amountOfErrors} ERROR(S)`}
      />
    ) : null

  const batchStatus = () => (
    <span style={sentDate ? styles.success : styles.error}>{sentDate ? 'SENT TO SISU' : 'NOT SENT'}</span>
  )

  const getDateSent = () =>
    sentDate ? (
      <p style={styles.info}>
        {formattedDate}, by: {_.uniq(senderNames).join(',')}
      </p>
    ) : null

  return (
    <div style={{ marginTop: '6px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        {batchStatus()}
        {getErrorAmount()}
        {getMissingEnrollment()}
      </Box>
      {getDateSent()}
    </div>
  )
}

export default ReportStatus
