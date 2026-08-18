import React, { useEffect } from 'react'
import * as _ from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Button,
  Stack,
  Tooltip
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'

import Notification from '@client/components/Message'
import {
  openReport,
  refreshBatchStatus,
  getAllMoocSisReportsAction,
  getAllSisReportsAction,
  getAllUnsentEntriesAction,
  getOffsetForBatchAction
} from '@client/utils/redux/sisReportsReducer'
import DeleteBatchButton from './DeleteBatchButton'
import SendToSisButton from './SendToSisButton'
import ReportStatus from './ReportStatus'
import ReportTable from './ReportTable'
import Pagination from '../Pagination'
import Filters from './Filters'
import './reportStyles.css'

const SisSuccessMessage = () => (
  <Alert severity="success" sx={{ mt: 2 }}>
    Entries sent successfully to Sisu
  </Alert>
)

const getCourseUnitRealisationSisuUrl = (realisation) => `
  https://sis-helsinki${process.env.NODE_ENV === 'staging' ? '-test' : ''}.funidata.fi
/teacher/role/staff/teaching/course-unit-realisations/view/${realisation}/attainments/list
`

const getBatchLink = (id) => {
  if (process.env.NODE_ENV === 'production')
    return `https://opetushallinto.cs.helsinki.fi/suoritustarkistin/reports/sisu/${id}`
  if (process.env.NODE_ENV === 'staging') return `https://toska-staging.cs.helsinki.fi/suotar/reports/sisu/${id}`
  return `http://localhost:8000/reports/sisu/${id}`
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
        <Button variant="outlined" startIcon={<OpenInNewIcon />}>
          View attainments in Sisu
        </Button>
      </a>
    ) : null

  const CopyBatchLinkButton = ({ batchId }) => (
    <Button
      variant="outlined"
      startIcon={<ContentCopyIcon />}
      onClick={() => {
        navigator.clipboard.writeText(getBatchLink(batchId))
      }}
    >
      Copy link to report
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
      <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyCsv(entries)}>
        Copy missing to csv
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
      variant="outlined"
      startIcon={<RefreshIcon />}
    >
      Refresh from Sisu
    </Button>
  )

  const loading = openAccordions.includes(report[0].batchId) && batchLoading

  return (
    <Box sx={{ margin: 0, padding: 0, opacity: loading ? 0.5 : 1 }}>
      <p>
        Completions reported by{' '}
        <strong>
          {!report[0].reporter || report[0].batchId.startsWith('limbo') ? 'Suotar-bot' : report[0].reporter.name}
        </strong>
      </p>
      {report[0].batchId.startsWith('limbo') ? (
        <Alert severity="info" sx={{ my: 1 }}>
          This report contains previously reported entries for which an enrollment has been found.
        </Alert>
      ) : null}
      {!report[0].batchId.startsWith('limbo') && report.some(({ entry }) => entry.missingEnrolment) ? (
        <Alert severity="info" sx={{ my: 1 }}>
          Completions with yellow background are missing enrollments and will not be sent to Sisu. When an enrollment
          for the completion is found, the completion will be sent to Sisu.
        </Alert>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, my: 1 }}>
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
        {entriesMissingEnrollment.length > 0 && <CopyMissingCsvButton entries={entriesMissingEnrollment} />}
      </Stack>

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
    </Box>
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
  const date = moment(batch[0].createdAt).format('DD.MM.YY - HH:mm:ss')
  const extras = extraCodes && extraCodes.length ? `+ ${extraCodes.length} others` : ''
  const titleString = batch[0].batchId.startsWith('limbo') ? batch[0].batchId : `${name} - ${code} ${extras} - ${date}`
  return {
    dataCy: `report-${code}`,
    node: (
      <Box sx={{ color: 'text.secondary', fontWeight: 400 }}>
        {extraCodes.length ? (
          <Tooltip title={extraCodes.map((c, i) => `${extraNames[i] || name}  - ${c}`).join('\n') || 'aa'}>
            <span>{titleString}</span>
          </Tooltip>
        ) : (
          titleString
        )}
        <ReportStatus batch={batch} />
      </Box>
    )
  }
}

// Which slice of state.sisReports this instance renders, and how it is fetched. The
// unsent variant is the same reports, narrowed to the batches still waiting to be
// sent, so it reuses everything below rather than displaying a batch its own way.
const getVariant = ({ mooc, unsent }) => {
  if (unsent) return { key: 'unsentEntries', action: getAllUnsentEntriesAction }
  if (mooc) return { key: 'moocReports', action: getAllMoocSisReportsAction }
  return { key: 'reports', action: getAllSisReportsAction }
}

export default ({ mooc, unsent }) => {
  const { activeBatch } = useParams()
  const openAccordions = useSelector((state) => state.sisReports.openAccordions)
  const batchLoading = useSelector((state) => state.sisReports.singleBatchPending)
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)

  const { key, action } = getVariant({ mooc, unsent })

  const { rows, offset, reportsFetched } = useSelector((state) => state.sisReports[key])
  const { pending, allowFetch } = useSelector((state) => state.sisReports)

  useEffect(() => {
    // If we have batch id in url we need to wait
    // for correct offset before fetching batch
    if (!reportsFetched && !pending && (!activeBatch || (activeBatch && allowFetch))) dispatch(action({ offset }))
  }, [allowFetch, mooc, unsent, reportsFetched, pending])

  useEffect(() => {
    // Fire fetch offset for batch in url
    if (activeBatch && !reportsFetched && !pending) {
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
    .map((report, index) => {
      const reportWithEntries = report.sort((a, b) => {
        if (!a.entry.missingEnrolment && !b.entry.missingEnrolment) return a.entry.type.localeCompare(b.entry.type)
        return a.entry.missingEnrolment - b.entry.missingEnrolment
      })
      if (!reportWithEntries || !reportWithEntries.length) return null

      return {
        key: `panel-${index}`,
        batchId: reportWithEntries[0].batchId,
        title: title(reportWithEntries),
        content: reportContents(reportWithEntries, dispatch, user, openAccordions, batchLoading)
      }
    })
    .filter(Boolean)

  return (
    <Box sx={{ opacity: pending ? 0.5 : 1 }}>
      <Notification />
      {/* The unsent tab is its own filter, the endpoint takes none. */}
      {!unsent && <Filters reduxKey={key} action={action} />}
      {!rows.length && reportsFetched ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>No reports found</AlertTitle>
        </Alert>
      ) : (
        // Semantic took a panels array with exclusive={false}; MUI composes each panel,
        // and which ones are open stays driven by openAccordions in redux.
        <Box data-cy="reports-list" sx={{ mt: 3 }}>
          {panels.map((panel) => (
            <Accordion
              key={panel.key}
              expanded={openAccordions.includes(panel.batchId)}
              onChange={() => dispatch(openReport(panel.batchId))}
              // disableGutters stops MUI adding vertical margin when a panel expands;
              // the spacing between rows is a constant instead.
              disableGutters
              elevation={0}
              variant="outlined"
              sx={{ mb: 1, '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} data-cy={panel.title.dataCy}>
                {panel.title.node}
              </AccordionSummary>
              <AccordionDetails>{panel.content}</AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      <Pagination reduxKey={key} action={action} disableFilters={unsent} />
    </Box>
  )
}
