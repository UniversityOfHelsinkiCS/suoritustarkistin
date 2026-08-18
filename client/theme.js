import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    fontFamily: "Lato, 'Helvetica Neue', Arial, Helvetica, sans-serif",
    htmlFontSize: 14,
    // Semantic's .ui.header was 700 across the board; MUI's headings are 400-500, which
    // reads noticeably lighter for the section titles this app uses them for.
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 }
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontSize: '1rem', minHeight: 64, paddingTop: 8, paddingBottom: 8 }
      }
    },
    MuiTabs: { styleOverrides: { root: { minHeight: 64 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: '1rem', padding: '0.6em 0.9em' } } }
  }
})

export default theme
