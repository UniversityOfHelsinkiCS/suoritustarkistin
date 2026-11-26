import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SchoolIcon from '@mui/icons-material/School'
import { Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { DEV_STUDENTS } from '@shared/common'
import { useState } from 'react'

const STORAGE_KEY = 'devStudentsPanelOpen'

const readOpen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const writeOpen = (open) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(open))
  } catch {
    // Only remembers the panel state; nothing breaks without it
  }
}

/**
 * Dev only: the students the fake importer knows, so a report can be tried without
 * looking them up in e2e-importer/data.json.
 */
const DevStudentsPanel = () => {
  const [open, setOpen] = useState(readOpen)
  const [copied, setCopied] = useState(null)

  const toggle = () => {
    writeOpen(!open)
    setOpen(!open)
  }

  const copy = async (studentNumber) => {
    try {
      await navigator.clipboard.writeText(studentNumber)
      setCopied(studentNumber)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  return (
    <Box data-cy="dev-students-panel" sx={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1300, maxWidth: 420 }}>
      {open ? (
        <Paper elevation={6} sx={{ p: 2, border: '2px dashed', borderColor: 'warning.main' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Test students (fake importer)
            </Typography>
            <Button size="small" onClick={toggle}>
              Hide
            </Button>
          </Box>
          {DEV_STUDENTS.map(({ studentNumber, name, uses }) => (
            <Box key={studentNumber} sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography component="code" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {studentNumber}
                </Typography>
                <Tooltip title={copied === studentNumber ? 'Copied' : 'Copy student number'}>
                  <IconButton size="small" aria-label={`Copy ${studentNumber}`} onClick={() => copy(studentNumber)}>
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  {name}
                </Typography>
              </Box>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {uses.map((use) => (
                  <Typography key={use} component="li" variant="body2">
                    {use}
                  </Typography>
                ))}
              </Box>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary">
            Any other student number is unknown to the fake importer.
          </Typography>
        </Paper>
      ) : (
        <Button variant="contained" color="warning" startIcon={<SchoolIcon />} onClick={toggle}>
          Test students
        </Button>
      )}
    </Box>
  )
}

export default DevStudentsPanel
