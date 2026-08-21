import { Dialog, DialogContent } from '@mui/material'
import { useState } from 'react'

export default ({ trigger, children }) => {
  const [open, setOpen] = useState(null)
  const close = () => setOpen(false)

  return (
    <>
      {trigger(() => setOpen(true))}
      {open === null ? null : (
        <Dialog open={open} onClose={close} maxWidth="md" fullWidth>
          <DialogContent>{children(close)}</DialogContent>
        </Dialog>
      )}
    </>
  )
}
