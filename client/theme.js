import { createTheme } from '@mui/material/styles'

/**
 * Deliberately small. The migration keeps the app recognisable rather than
 * restyling it, so this only sets the few defaults that would otherwise be
 * re-invented in every migrated component.
 */
const theme = createTheme({
  typography: {
    // Semantic's own stack, so type stays familiar once semantic.min.css is gone
    fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
    /**
     * The app has always run on a 14px root (semantic.min.css sets it, and
     * custom.css now pins it so removing Semantic changes nothing). Without this,
     * every MUI rem resolves against 14px instead of the 16px it assumes and the
     * whole type scale renders ~12% small.
     */
    htmlFontSize: 14
  },
  palette: {
    // Semantic's palette, so the UI stays familiar. contrastText is explicit
    // because MUI's contrast algorithm picks black text on the lighter greens.
    primary: { main: '#2185d0', contrastText: '#fff' },
    error: { main: '#db2828', contrastText: '#fff' },
    success: { main: '#21ba45', contrastText: '#fff' }
  },
  components: {
    // No global defaultProps. Semantic's look is flat and low-contrast, so a
    // blanket variant here quietly restyles every screen at once.
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } }
  }
})

export default theme
