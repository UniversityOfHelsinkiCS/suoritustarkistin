import React from 'react'
import * as _ from 'lodash'
import moment from 'moment'

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

  const getMissing = () => (
    <>
      <p style={styles.success}>
        SENT TO SIS
      </p>
      <p style={styles.missing}>
        {amountMissingFromSisu} of {batch.length} NOT IN SISU
      </p>
      <p style={styles.info}>
        {formattedDate}, by: {_.uniq(senderNames).join(",")}
      </p>
    </>
  )

  const getSuccess = () => (
    <span>
      <p style={styles.success}>
        SENT TO SIS
      </p>
      <p style={styles.info}>
        {formattedDate}, by: {_.uniq(senderNames).join(",")}
      </p>
    </span>
  )

  const getNotSent = () => (
    <p style={styles.error}>
      NOT SENT TO SIS
    </p>
  )
  
  const getErrorAmount = () => (
    <p style={styles.missing}>
      {`CONTAINS ${amountOfErrors} ERROR(S)`}
    </p>
  ) 

  return (
    <div>
      {hasSuccessfullySentEntries && !amountMissingFromSisu && getSuccess()}
      {hasSuccessfullySentEntries && amountMissingFromSisu && getMissing()}
      {!hasSuccessfullySentEntries && getNotSent()}
      {amountOfErrors !== 0 && getErrorAmount()}
    </div>
  )
}

export default SisReportStatus