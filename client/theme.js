import { createTheme } from '@mui/material/styles'

/**
 * Deliberately small. The migration keeps the app recognisable rather than
 * restyling it, so this only sets the few defaults that would otherwise be
 * re-invented in every migrated component.
 */
const theme = createTheme({
  palette: {
    primary: { main: '#2185d0' }, // Semantic's blue, so the UI stays familiar
    error: { main: '#db2828' },
    success: { main: '#21ba45' }
  },
  components: {
    MuiButton: { defaultProps: { variant: 'contained' } },
    MuiTextField: { defaultProps: { size: 'small' } }
  }
})

export default theme
