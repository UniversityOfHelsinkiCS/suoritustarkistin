import { createTheme } from '@mui/material/styles'

/**
 * Deliberately small. The migration keeps the app recognisable rather than
 * restyling it, so this only sets the few defaults that would otherwise be
 * re-invented in every migrated component.
 */
const theme = createTheme({
  typography: {
    // Semantic's own stack, so type stays familiar once semantic.min.css is gone
    fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif"
  },
  palette: {
    primary: { main: '#2185d0' }, // Semantic's blue, so the UI stays familiar
    error: { main: '#db2828' },
    success: { main: '#21ba45' }
  },
  components: {
    // No global defaultProps. Semantic's look is flat and low-contrast, so a
    // blanket variant here quietly restyles every screen at once.
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } }
  }
})

export default theme
