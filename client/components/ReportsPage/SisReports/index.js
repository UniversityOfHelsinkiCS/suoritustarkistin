import React, { useEffect } from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { withRouter } from 'react-router-dom'
import moment from 'moment'
import { Accordion, Button, Icon, Message, Segment, Popup } from 'semantic-ui-react'

import Notification from 'Components/Message'
import {
  openReport,
  refreshBatchStatus,
  getAllMoocSisReportsAction,
  getAllSisReportsAction,
  getOffsetForBatchAction
} from 'Utilities/redux/sisReportsReducer'
import DeleteBatchButton from './DeleteBatchButton'
import SendToSisButton from './SendToSisButton'
import ReportStatus from './ReportStatus'
import ReportTable from './ReportTable'
import Pagination from '../Pagination'
import Filters from './Filters'
import './reportStyles.css'

const SisSuccessMessage = () => (
  <Message success>
    <Message.Header>All entries sent successfully to Sisu</Message.Header>
  </Message>
)

const getCourseUnitRealisationSisuUrl = (realisation) => `
  https://sis-helsinki${process.env.NODE_ENV === 'staging' ? '-test' : ''}.funidata.fi
/teacher/role/staff/teaching/course-unit-realisations/view/${realisation}/attainments/list
`

const getBatchLink = (id) => {
  if (process.env.NODE_ENV === 'production')
    return `https://opetushallinto.cs.helsinki.fi/suoritustarkistin/reports/sisu/${id}`
  else if (process.env.NODE_ENV === 'staging')
    return `https://opetushallinto.cs.helsinki.fi/staging/suoritustarkistin/reports/sisu/${id}`
  else return `http://localhost:8000/reports/sisu/${id}`
}

const reportContents = (report, dispatch, user, openAccordions, batchLoading) => {
  if (!report) return null

  const batchSent = report.some(({ entry }) => entry.sent)
  const reportContainsErrors = report.some(({ entry }) => entry.errors)
  const entriesWithoutErrors = report.filter(({ entry }) => !entry.errors && entry.sent)
  const entriesNotSentOrErroneous = report.filter(({ entry }) => entry.errors || !entry.sent)
  const entriesMissingEnrollment = report.filter(({ entry }) => entry.missingEnrolment)

  const ViewAttainmentsInSisu = ({ rawEntry }) =>
    !rawEntry.batchId.startsWith('limbo') ? (
      <a
        href={getCourseUnitRealisationSisuUrl(rawEntry.entry.courseUnitRealisationId)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button icon>
          <Icon name="external" /> View attainments in Sisu
        </Button>
      </a>
    ) : null

  const CopyBatchLinkButton = ({ batchId }) => (
    <Button
      onClick={() => {
        navigator.clipboard.writeText(getBatchLink(batchId))
      }}
      icon
    >
      <Icon name="copy" /> Copy link to report
    </Button>
  )

  const CopyMissingCsvButton = ({ entries }) => {
    const copyCsv = (entries) => () => {
      let csv = ''
      entries.forEach((entry) => {
        csv += `${entry.studentNumber};${entry.entry.email || ''}\n`
      })
      navigator.clipboard.writeText(csv)
    }

    return (
      <Button onClick={copyCsv(entries)}>
        <Icon name="copy" /> Copy missing to csv
      </Button>
    )
  }

  const RefreshBatch = ({ report }) => (
    <Button
      onClick={() =>
        dispatch(
          refreshBatchStatus({
            entryIds: report.filter(({ entry }) => entry.type === 'ENTRY').map(({ entry }) => entry.id),
            extraEntryIds: report.filter(({ entry }) => entry.type === 'EXTRA_ENTRY').map(({ entry }) => entry.id)
          })
        )
      }
      disabled={report.every(({ entry }) => !entry.sent)}
      icon
    >
      <Icon name="refresh" /> Refresh from Sisu
    </Button>
  )

  return (
    <Accordion.Content active={openAccordions.includes(report[0].batchId)}>
      <Segment
        loading={openAccordions.includes(report[0].batchId) && batchLoading}
        style={{ margin: 0, padding: 0 }}
        basic
      >
        <p>
          Completions reported by{' '}
          <strong>
            {!report[0].reporter || report[0].batchId.startsWith('limbo') ? 'Suotar-bot' : report[0].reporter.name}
          </strong>
        </p>
        {report[0].batchId.startsWith('limbo') ? (
          <Message info>
            <p>This report contains previously reported entries for which an enrollment has been found.</p>
          </Message>
        ) : null}
        {!report[0].batchId.startsWith('limbo') && report.some(({ entry }) => entry.missingEnrolment) ? (
          <Message info>
            <p>
              Completions with yellow background is missing enrollment and will not be sent to Sisu. When an enrollment
              is found for the entry, it will be sent to Sisu.
            </p>
          </Message>
        ) : null}

        {user.adminMode && (
          <>
            <SendToSisButton
              idsToSend={report
                .filter(({ entry }) => (!entry.sent || entry.errors) && !entry.missingEnrolment)
                .reduce(
                  (acc, { entry }) => {
                    if (entry.type === 'ENTRY') acc.entries.push(entry.id)
                    else acc.extraEntries.push(entry.id)
                    return acc
                  },
                  { entries: [], extraEntries: [] }
                )}
            />
            {!batchSent ? <DeleteBatchButton batchId={report[0].batchId} /> : null}
            <ViewAttainmentsInSisu rawEntry={report[0]} />
            <RefreshBatch report={report} />
          </>
        )}
        <CopyBatchLinkButton batchId={report[0].batchId} />
        {entriesMissingEnrollment.length > 0 && (
          <CopyMissingCsvButton entries={entriesMissingEnrollment} />
        )}

        {batchSent && !reportContainsErrors && <SisSuccessMessage />}

        {
          // Display accordion only when batch contains sent entries or entries with errors
          !batchSent ? (
            <ReportTable rows={report} allowDelete={user.adminMode && !batchSent} />
          ) : (
            <div data-cy={`entries-panel-${report[0].batchId}`}>
              {entriesNotSentOrErroneous.length ? (
                <div className="sis-report-table-container">
                  <h4>Entries with errors or missing enrollment</h4>
                  <ReportTable rows={entriesNotSentOrErroneous} allowDelete={user.adminMode} />
                </div>
              ) : null}
              {entriesWithoutErrors.length && (
                <div className="sis-report-table-container">
                  {entriesNotSentOrErroneous.length ? <h4>Successfully sent entries</h4> : null}
                  <ReportTable
                    rows={entriesWithoutErrors}
                    allowDelete={false} // Never allow delete for successfully sent entries
                  />
                </div>
              )}
            </div>
          )
        }
      </Segment>
    </Accordion.Content>
  )
}

const title = (batch) => {
  const { courseCodes, courseNames } = batch.reduce(
    (acc, { course }) => {
      acc.courseCodes.add(course.courseCode)
      acc.courseNames.add(course.name)
      return acc
    },
    { courseCodes: new Set(), courseNames: new Set() }
  )
  const [code, ...extraCodes] = Array.from(courseCodes)
  const [name, ...extraNames] = Array.from(courseNames)
  const date = moment(batch[0].createdAt).format('DD.MM.YY - HH:mm:SS')
  const extras = extraCodes && extraCodes.length ? `+ ${extraCodes.length} others` : ''
  const titleString = batch[0].batchId.startsWith('limbo') ? batch[0].batchId : `${name} - ${code} ${extras} - ${date}`
  return (
    <Accordion.Title data-cy={`report-${code}`}>
      {extraCodes.length ? (
        <Popup
          content={extraCodes.map((c, i) => `${extraNames[i] || name}  - ${c}`).join('\n') || 'aa'}
          trigger={<span>{titleString}</span>}
        />
      ) : (
        titleString
      )}
      <ReportStatus batch={batch} />
    </Accordion.Title>
  )
}

export default withRouter(({ mooc, match }) => {
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)
  const batchLoading = useSelector((state) => state.sisReports.singleBatchPending)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)

  const { rows, offset, reportsFetched } = useSelector((state) =>
    mooc ? state.sisReports.moocReports : state.sisReports.reports
  )
  const { pending, allowFetch } = useSelector((state) => state.sisReports)

  useEffect(() => {
    const fetch = (mooc) => {
      if (mooc) dispatch(getAllMoocSisReportsAction({ offset }))
      else dispatch(getAllSisReportsAction({ offset }))
    }

    const { activeBatch } = match.params
    // If we have batch id in url we need to wait
    // for correct offset before fetching batch
    if (!reportsFetched && !pending && (!activeBatch || (activeBatch && allowFetch))) fetch(mooc)
  }, [allowFetch, mooc, reportsFetched, pending])

  useEffect(() => {
    // Fire fetch offset for batch in url
    if (match && match.params && match.params.activeBatch && !reportsFetched && !pending) {
      const { activeBatch } = match.params
      dispatch(openReport(activeBatch))
      dispatch(getOffsetForBatchAction(activeBatch))
    }
  }, [])

  const batchedReports = Object.values(_.groupBy(rows, 'batchId'))

  const panels = batchedReports
    .filter((report) => {
      if (mooc || user.isAdmin) return true
      const notSentWithValidEntries = report.every((row) => row.entry && !row.entry.missingEnrolment && !row.entry.sent)
      return !notSentWithValidEntries
    })
    .sort((a, b) => new Date(b[0].updatedAt) - new Date(a[0].updatedAt))
    .map((report, index) => {
      const reportWithEntries = report.sort((a, b) => {
        if (!a.entry.missingEnrolment && !b.entry.missingEnrolment) return a.entry.type.localeCompare(b.entry.type)
        return a.entry.missingEnrolment - b.entry.missingEnrolment
      })
      if (!reportWithEntries || !reportWithEntries.length) return null

      return {
        key: `panel-${index}`,
        title: title(reportWithEntries),
        content: reportContents(reportWithEntries, dispatch, user, openAccordions, batchLoading),
        onTitleClick: () => dispatch(openReport(reportWithEntries[0].batchId))
      }
    })

  const action = mooc ? getAllMoocSisReportsAction : getAllSisReportsAction
  const key = mooc ? 'moocReports' : 'reports'

  return (
    <Segment loading={pending} basic>
      <Notification />
      <Filters reduxKey={key} action={action} />
      {!rows.length && reportsFetched ? (
        <Message info>
          <Message.Header>No reports found</Message.Header>
        </Message>
      ) : (
        <Accordion panels={panels} exclusive={false} data-cy="reports-list" fluid styled />
      )}
      <Pagination reduxKey={key} action={action} />
    </Segment>
  )
})
