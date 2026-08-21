import { Box, Button, Popover, Stack } from '@mui/material'
import { useState } from 'react'

const ConfirmPopover = ({ trigger, onOpen, children }) => {
  const [anchor, setAnchor] = useState(null)
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  const handleOpen = (event) => {
    setAnchor(event.currentTarget)
    setOpen(true)
    if (onOpen) onOpen()
  }

  return (
    <>
      {trigger(handleOpen)}
      {anchor === null ? null : (
        <Popover
          open={open}
          anchorEl={anchor}
          onClose={close}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Box sx={{ p: 2, maxWidth: 400 }}>{children(close)}</Box>
        </Popover>
      )}
    </>
  )
}

export const ConfirmButton = ({
  label,
  confirmLabel,
  description,
  color = 'error',
  disabled,
  dataCy,
  confirmDataCy,
  cancelDataCy,
  onOpen,
  onConfirm
}) => (
  <ConfirmPopover
    onOpen={onOpen}
    trigger={(open) => (
      <Button variant="contained" size="small" color={color} data-cy={dataCy} disabled={disabled} onClick={open}>
        {label}
      </Button>
    )}
  >
    {(close) => (
      <>
        {description}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" data-cy={cancelDataCy} onClick={close}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={color}
            data-cy={confirmDataCy}
            onClick={() => {
              onConfirm()
              close()
            }}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </>
    )}
  </ConfirmPopover>
)

export default ConfirmPopover
