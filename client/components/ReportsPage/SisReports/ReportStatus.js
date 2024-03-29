import React from 'react'
import * as _ from 'lodash'
import moment from 'moment'
import { Label } from 'semantic-ui-react'

const styles = {
  success: {
    marginBottom: '0',
    color: 'green'
  },
  missing: {
    marginBottom: '0',
    color: 'orange'
  },
  info: {
    marginBottom: '0',
    color: 'gray'
  },
  error: {
    marginBottom: '0',
    color: 'red'
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
      <Label basic color="brown" pointing="left">
        {missingEnrollments} MISSING ENROLLMENT
      </Label>
    ) : null

  const getErrorAmount = () =>
    amountOfErrors !== 0 ? (
      <Label basic color="red" pointing="left">
        {`CONTAINS ${amountOfErrors} ERROR(S)`}
      </Label>
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
      {batchStatus()}
      {getErrorAmount()}
      {getMissingEnrollment()}
      {getDateSent()}
    </div>
  )
}

export default ReportStatus
