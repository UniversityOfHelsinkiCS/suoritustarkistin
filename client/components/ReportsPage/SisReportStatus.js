import React from 'react'
import * as _ from 'lodash'
import moment from 'moment'
import { Label } from 'semantic-ui-react'

const styles = {
  success: {
    marginBottom: "0",
    color: "green"
  },
  missing: {
    marginBottom: "0",
    color: "orange"
  },
  info: {
    marginBottom: "0",
    color: "gray"
  },
  error: {
    marginBottom: "0",
    color: "red"
  }
}

const SisReportStatus = ({ batch }) => {
  if (!batch) return null

  const sentDate = batch.filter(({ entry }) => entry.sent).sort((a, b) => new Date(b.entry.sent) - new Date(a.entry.sent))[0] || null
  const senderNames = batch.filter(({ entry }) => entry.sender).map(({ entry }) => entry.sender.name)
  const formattedDate = moment(sentDate).format("DD.MM.YYYY")
  const hasSuccessfullySentEntries = batch.some(({ entry }) => !entry.errors && entry.sent)
  const amountOfErrors = batch.filter(({ entry }) => entry.errors).length
  const amountMissingFromSisu = batch.filter(({ entry }) => !entry.registered).length

  const getMissing = () => hasSuccessfullySentEntries && amountMissingFromSisu ? (
    <Label basic color='orange' pointing='left'>
      {amountMissingFromSisu} of {batch.length} NOT IN SISU
    </Label>

  ) : null

  const getErrorAmount = () => amountOfErrors !== 0 ? (
    <Label basic color='red' pointing='left'>
      {`CONTAINS ${amountOfErrors} ERROR(S)`}
    </Label>
  ) : null

  const batchStatus = (sent) => <span style={sent ? styles.success : styles.error}>
    {sent ? 'SENT TO SIS' : 'NOT SENT TO SIS'}
  </span>

  const getDateSent = () => sentDate ? <p style={styles.info}>
    {formattedDate}, by: {_.uniq(senderNames).join(",")}
  </p> : null

  return (
    <div>
      {batchStatus(hasSuccessfullySentEntries)}
      {getMissing()}
      {getErrorAmount()}
      {getDateSent()}
    </div>
  )
}

export default SisReportStatus