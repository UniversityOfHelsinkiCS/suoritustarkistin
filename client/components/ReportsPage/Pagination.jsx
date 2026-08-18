import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Box, Button, ButtonGroup } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'

const styles = {
  display: 'flex',
  justifyContent: 'center',
  margin: '2rem 0 1rem 0'
}

/**
 * Component for pagination buttons
 * @param reduxKey key for state.sisReports where to get offset and limit
 * @param action action which fetches data, takes offset and limit
 * @returns
 */
const Pagination = ({ reduxKey, action, disableFilters = false }) => {
  const { offset, limit, count } = useSelector((state) => state.sisReports[reduxKey])
  const filters = useSelector((state) => state.sisReports.filters)
  const dispatch = useDispatch()

  const getPayload = (offset) => {
    const payload = { offset, limit }
    if (!disableFilters) payload.filters = filters
    return payload
  }

  const fetch = (offset) => dispatch(action(getPayload(offset)))

  return (
    <Box sx={styles}>
      <ButtonGroup variant="contained">
        <Button disabled={offset === 0} startIcon={<ArrowBackIcon />} onClick={() => fetch(offset - limit)}>
          Newer
        </Button>
        <Button disabled={offset + limit >= count} endIcon={<ArrowForwardIcon />} onClick={() => fetch(offset + limit)}>
          Older
        </Button>
      </ButtonGroup>
    </Box>
  )
}

export default Pagination
