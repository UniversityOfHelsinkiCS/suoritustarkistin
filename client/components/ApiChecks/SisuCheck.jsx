import SisuInstance from '@client/components/ApiChecks/SisuInstance'
import { checkSisu } from '@client/utils/redux/apiCheckReducer'
import SearchIcon from '@mui/icons-material/Search'
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

export default () => {
  const dispatch = useDispatch()
  const { sisu } = useSelector((state) => state.apiChecks)
  const [data, setData] = useState({ course: '' })
  const [active, setActive] = useState(-1)

  const handleCheck = (event) => {
    event.preventDefault()
    dispatch(checkSisu(data.course))
  }

  const countEnrollments = (realisations) => realisations.reduce((sum, r) => sum + r.enrollments.length, 0)

  const getRealisationCards = () => {
    if (!sisu) return ''
    const realisations = sisu.realisations
    if (!realisations || !realisations.length) return <b>No realisations found from Sisu with the course code</b>

    const kept = realisations.filter((r) => !r.droppedByCron)

    return (
      <div>
        <p>
          Cron uses {kept.length}/{realisations.length} realisations, {countEnrollments(kept)}/
          {countEnrollments(realisations)} enrollments (activityPeriod cutoff {sisu.cutoff})
        </p>
        {realisations.map((realisation, index) => (
          <SisuInstance
            key={`${realisation.activityPeriod?.startDate}+${index}`}
            realisation={realisation}
            index={index}
            active={active}
            setActive={setActive}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '300px', padding: '50px 30px' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Sisu enrolment check
      </Typography>
      <Box component="form" onSubmit={handleCheck} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Enter course code"
          value={data.course || ''}
          placeholder="TKT21027"
          onChange={(e) => setData({ course: e.target.value })}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button type="submit" variant="contained" startIcon={<SearchIcon />}>
                    Check
                  </Button>
                </InputAdornment>
              )
            }
          }}
        />
      </Box>
      {getRealisationCards()}
    </div>
  )
}
