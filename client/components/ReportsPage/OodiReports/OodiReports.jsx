import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import TabLoader from '@client/components/ReportsPage/TabLoader'

const Downloaded = () => <div style={{ color: 'green' }}>DOWNLOADED</div>
const NotDownloaded = () => <div style={{ color: 'red' }}>NOT DOWNLOADED</div>

const LANGUAGES = { 1: 'fi', 2: 'sv', 6: 'en' }

const reportTable = (report) => {
  const Rows = () => (
    <TableBody>
      {report.data.split('\n').map((rawLine, index) => {
        const line = rawLine.split('#')
        return (
          <TableRow key={`row-${index}`}>
            <TableCell>{line[3]}</TableCell>
            <TableCell>{line[4]}</TableCell>
            <TableCell>{line[0]}</TableCell>
            <TableCell>{line[7]}</TableCell>
            <TableCell>{line[17]}</TableCell>
            <TableCell>{LANGUAGES[line[2]]}</TableCell>
            <TableCell>{line[5]}</TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  )

  return (
    <Table size="small" sx={celledBorders}>
      <TableHead>
        <TableRow>
          <TableCell>Course code</TableCell>
          <TableCell>Course name</TableCell>
          <TableCell>Student number</TableCell>
          <TableCell>Grade</TableCell>
          <TableCell>Credits</TableCell>
          <TableCell>Language</TableCell>
          <TableCell>Completion date</TableCell>
        </TableRow>
      </TableHead>
      <Rows />
    </Table>
  )
}

const celledBorders = {
  '& td, & th': { borderRight: '1px solid rgba(34, 36, 38, 0.1)' },
  '& td:last-of-type, & th:last-of-type': { borderRight: 0 }
}

const title = (report) => {
  const fileName = report.fileName.split('%')
  const timestamp = fileName[1].split('-')
  return (
    <>
      {`${fileName[0]} - ${timestamp[0]} - ${timestamp[1].substring(0, 2)}:${timestamp[1].substring(
        2,
        4
      )}:${timestamp[1].substring(4, 6)}`}
      {report.lastDownloaded ? <Downloaded /> : <NotDownloaded />}
    </>
  )
}

export default () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const reports = useSelector((state) => state.oodiReports)
  if (reports.pending || loading) return <TabLoader />

  const manualReports = reports.data.filter((report) => report.reporterId) // filter out EoAI reports.

  if (manualReports.length === 0) return <div>NO REPORTS FOUND.</div>

  return (
    <div>
      {manualReports.map((r, i) => (
        <Accordion key={`panel-${i}`} disableGutters elevation={0} variant="outlined" sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>{title(r)}</AccordionSummary>
          <AccordionDetails>{reportTable(r)}</AccordionDetails>
        </Accordion>
      ))}
    </div>
  )
}
