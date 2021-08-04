import React, { useState } from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Accordion, Button, Icon, Message, Segment } from 'semantic-ui-react'

import DeleteBatchButton from './DeleteBatchButton'
import SendToSisButton from './SendToSisButton'
import ReportStatus from './ReportStatus'
import ReportTable from './ReportTable'
import Filters, { filterBatches } from './Filters'
import { refreshBatchStatus, openReport } from 'Utilities/redux/sisReportsReducer'
import Notification from 'Components/Message'

import './reportStyles.css'

const SisSuccessMessage = () => <Message success>
  <Message.Header>All entries sent successfully to Sisu</Message.Header>
</Message>

const getCourseUnitRealisationSisuUrl = (realisation) => `
  https://sis-helsinki${process.env.NODE_ENV === 'staging' ? '-test' : ''}.funidata.fi
/teacher/role/staff/teaching/course-unit-realisations/view/${realisation}/attainments/list
`

const getBatchLink = (id) => process.env.NODE_ENV === 'production'
  ? `https://opetushallinto.cs.helsinki.fi/suoritustarkistin/reports/sisu/${id}`
  : `https://opetushallinto.cs.helsinki.fi/staging/suoritustarkistin/reports/sisu/${id}`


const reportContents = (report, dispatch, user, openAccordions, batchLoading) => {
  if (!report) return null

  const batchSent = report.some(({ entry }) => entry.sent)
  const reportContainsErrors = report.some(({ entry }) => entry.errors)
  const entriesWithoutErrors = report.filter(({ entry }) => !entry.errors && entry.sent)
  const entriesNotSentOrErroneous = report.filter(({ entry }) => entry.errors || !entry.sent)

  const panels = []

  if (entriesWithoutErrors.length)
    panels.push({
      key: 'entries-without-errors',
      title: 'Successfully sent entries',
      content: (
        <Accordion.Content>
          <ReportTable
            rows={entriesWithoutErrors}
            allowDelete={false} // Never allow delete for successfully sent entries
          />
        </Accordion.Content>
      )
    })

  if (entriesNotSentOrErroneous.length)
    panels.unshift({
      active: true,
      key: 'entries-with-errors',
      title: 'Entries with errors or missing enrollment',
      content: (
        <Accordion.Content>
          <ReportTable
            rows={entriesNotSentOrErroneous}
            allowDelete={user.adminMode}
          />
        </Accordion.Content>
      )
    })

  const ViewAttainmentsInSisu = ({ rawEntry }) => !rawEntry.batchId.startsWith("limbo")
    ? <a href={getCourseUnitRealisationSisuUrl(rawEntry.entry.courseUnitRealisationId)} target="_blank" rel="noopener noreferrer">
      <Button icon>
        <Icon name="external" /> View attainments in Sisu
      </Button>
    </a>
    : null

  const CopyBatchLinkButton = ({ batchId }) => <Button onClick={() => { navigator.clipboard.writeText(getBatchLink(batchId)) }} icon>
    <Icon name="copy" /> Copy link to report
  </Button>


  const RefreshBatch = ({ report }) => <Button
    onClick={() => dispatch(
      refreshBatchStatus(report.map(({ entry }) => entry.id))
    )}
    disabled={report.every(({ entry }) => !entry.sent)}
    icon
  >
    <Icon name="refresh" /> Refresh from Sisu
  </Button>

  return (
    <Accordion.Content active={openAccordions.includes(report[0].batchId)}>
      <Segment loading={openAccordions.includes(report[0].batchId) && batchLoading} style={{ margin: 0, padding: 0 }} basic>
        <p>Completions reported by <strong>{(!report[0].reporter || report[0].batchId.startsWith("limbo")) ? "Suotar-bot" : report[0].reporter.name}</strong></p>
        {report[0].batchId.startsWith("limbo")
          ? <Message info>
            <p>This report contains previously reported entries for which an enrollment has been found.</p>
          </Message>
          : null}
        {!report[0].batchId.startsWith("limbo") && report.some(({ entry }) => entry.missingEnrolment)
          ? <Message info>
            <p>Completions with yellow background is missing enrollment and will not be sent to Sisu. When an enrollment is found for the entry, it will be sent to Sisu.</p>
          </Message>
          : null}

        {user.adminMode && (
          <>
            <SendToSisButton
              entries={report
                .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
                .map(({ entry }) => entry.id)
              } />
            {!batchSent ? <DeleteBatchButton batchId={report[0].batchId} /> : null}
            <ViewAttainmentsInSisu rawEntry={report[0]} />
            <RefreshBatch report={report} />
          </>
        )}
        <CopyBatchLinkButton batchId={report[0].batchId} />

        {batchSent && !reportContainsErrors && <SisSuccessMessage />}

        { // Display accordion only when batch contains sent entries or entries with errors
          !batchSent
            ? <ReportTable
              rows={report}
              allowDelete={user.adminMode && !batchSent}
            />
            : <Accordion.Accordion
              data-cy={`sis-entries-panel-${report[0].batchId}`}
              panels={panels}
              exclusive={false}
            />
        }
      </Segment>
    </Accordion.Content>
  )
}

const title = (batch) => {
  const [courseCode, date, time] = batch[0].batchId.split('-')
  const courseName = batch[0].course ? batch[0].course.name : ''
  const titleString = batch[0].batchId.startsWith("limbo")
    ? batch[0].batchId
    : `${courseName} - ${courseCode} - ${date} - ${time.substring(0, 2)}:${time.substring(2, 4)}:${time.substring(4, 6)}`
  return (
    <Accordion.Title data-cy={`sis-report-${courseCode}`}>
      {titleString}
      <ReportStatus batch={batch} />
    </Accordion.Title>
  )
}

export default withRouter(({ reports, user }) => {
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)
  const batchLoading = useSelector((state) => state.sisReports.singleBatchPending)
  const [filters, setFilters] = useState({ errors: false, missing: false, notSent: false, noEnrollment: false, search: '' })
  const dispatch = useDispatch()


  if (!reports || reports.length === 0) return <div data-cy="sis-no-reports">NO REPORTS FOUND.</div>

  const batchedReports = Object.values(_.groupBy(reports, 'batchId'))
    .sort((a, b) => b[0].createdAt.localeCompare(a[0].createdAt))

  const panels = batchedReports
    .filter((report) => filterBatches(report, filters))
    .sort((a, b) => new Date(b[0].updatedAt) - new Date(a[0].updatedAt))
    .map((report, index) => {
      const reportWithEntries = report
        .filter((e) => e && e.entry)
        .sort((a, b) => a.entry.missingEnrolment - b.entry.missingEnrolment)
      if (!reportWithEntries || !reportWithEntries.length) return null

      return {
        key: `panel-${index}`,
        title: title(reportWithEntries),
        content: reportContents(reportWithEntries, dispatch, user, openAccordions, batchLoading),
        onTitleClick: () => dispatch(openReport(reportWithEntries[0].batchId))
      }
    })

  return <>
    <Notification />
    <Filters filters={filters} setFilters={setFilters} />
    <Accordion panels={panels} exclusive={false} data-cy="sis-reports-list" fluid styled />
  </>
})
