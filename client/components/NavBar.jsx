import React, { useState, useEffect } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { activateAdminModeAction, disableAdminModeAction, logoutAction } from '@client/utils/redux/userReducer'
import { images } from '@client/utils/common'
import FakeShibboMenu from '@client/components/fakeShibboMenu'
import { setFilterAction, getAllSisReportsAction, getUnsentBatchCountAction } from '../utils/redux/sisReportsReducer'

const STAGING = process.env.NODE_ENV === 'staging'

const getMenuItemFromUrl = () => {
  // In production path is prefixed with /suoritustarkistin/
  const index = process.env.NODE_ENV === 'development' ? 1 : 2
  const path = window.location.pathname.split('/')[index] || '/'
  if (path === '/') return 'newReport'
  return path
}

export default () => {
  const [activeItem, setActiveItem] = useState(getMenuItemFromUrl())
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)
  const { offset, limit } = useSelector((state) => state.sisReports.reports)
  const unsentBatchCount = useSelector((state) => state.sisReports.unsentBatchCount)

  const handleLogout = () => {
    dispatch(logoutAction())
  }

  useEffect(() => {
    if (user.adminMode) dispatch(getUnsentBatchCountAction())
  }, [user.adminMode, dispatch])

  const handleAdminModeToggle = () => {
    // oxlint-disable-next-line no-unused-expressions
    user.adminMode ? dispatch(disableAdminModeAction()) : dispatch(activateAdminModeAction())

    dispatch(setFilterAction('adminmode', !user.adminMode))
    if (window.location.pathname !== '/reports') dispatch(getAllSisReportsAction({ offset, limit }))
  }

  // Semantic's Menu.Item passed the name through its onClick; with plain buttons it is
  // simpler to bind the name at the call site.
  const handleItemClick = (name) => () => setActiveItem(name === 'logo' ? '' : name)

  // Semantic's menu items are flat, full-height and separated by a hairline border,
  // with a light grey wash on the active one. This reproduces that.
  const itemStyle = (name) => ({
    color: 'rgba(0, 0, 0, 0.87)',
    fontSize: '1.2rem',
    fontWeight: 400,
    borderRadius: 0,
    px: '1.15em',
    alignSelf: 'stretch',
    borderLeft: '1px solid rgba(34, 36, 38, 0.1)',
    backgroundColor: activeItem === name ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' }
  })

  // A nav link that is not available to this user stays visible but is a real disabled
  // button rather than a link, so it cannot be navigated to by any means.
  const NavButton = ({ name, to, dataCy, disabled, children }) =>
    disabled ? (
      <Button data-cy={dataCy} disabled sx={itemStyle(name)}>
        {children}
      </Button>
    ) : (
      <Button data-cy={dataCy} component={Link} to={to} onClick={handleItemClick(name)} sx={itemStyle(name)}>
        {children}
      </Button>
    )

  const handleUnhijack = () => {
    window.localStorage.removeItem('adminLoggedInAs')
    window.location.reload()
  }

  if (!user) return null

  const noPermissions = !user.isAdmin && !user.isGrader

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        backgroundColor: STAGING ? '#ffeaed' : '#fff',
        borderBottom: '1px solid rgba(34, 36, 38, 0.15)'
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: '5em', flexWrap: 'wrap', px: 0 }}>
        <Button
          component={Link}
          to="/"
          onClick={handleItemClick('logo')}
          disableRipple
          sx={{
            color: 'rgba(0, 0, 0, 0.87)',
            fontSize: 'xx-large',
            px: '0.5em',
            alignSelf: 'stretch',
            borderRadius: 0,
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <img src={images.toska_color} style={{ marginRight: '0.5em', height: '2.2rem' }} alt="tosca" /> SUOTAR
          {STAGING ? (
            <Typography component="span" sx={{ fontSize: '2rem' }}>
              -staging
            </Typography>
          ) : null}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <NavButton name="newReport" to="/" dataCy="nav-new-report" disabled={noPermissions}>
          New report
        </NavButton>

        <NavButton name="reports" to="/reports" dataCy="nav-reports" disabled={noPermissions}>
          View reports
          {Boolean(user.adminMode && unsentBatchCount) && (
            <Box
              component="span"
              sx={{
                ml: '0.6em',
                px: '0.65em',
                py: '0.5em',
                minWidth: '2em',
                display: 'inline-block',
                textAlign: 'center',
                borderRadius: '500rem',
                backgroundColor: '#db2828',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              {unsentBatchCount}
            </Box>
          )}
        </NavButton>

        {user.adminMode ? (
          <NavButton name="automated-reports" to="/automated-reports" dataCy="nav-automated-reports">
            Automated reports
          </NavButton>
        ) : null}
        {user.adminMode ? (
          <NavButton name="apichecks" to="/apichecks" dataCy="nav-apichecks">
            API Checks
          </NavButton>
        ) : null}
        {user.adminMode ? (
          <NavButton name="courses" to="/courses" dataCy="nav-courses">
            Edit courses
          </NavButton>
        ) : null}
        {user.adminMode ? (
          <NavButton name="users" to="/users" dataCy="nav-users">
            Edit users
          </NavButton>
        ) : null}
        {user.adminMode ? (
          <NavButton name="sandbox" to="/sandbox" dataCy="nav-sandbox">
            Sandbox
          </NavButton>
        ) : null}

        {user.isAdmin ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'stretch',
              px: '1.15em',
              borderLeft: '1px solid rgba(34, 36, 38, 0.1)'
            }}
          >
            <Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(0, 0, 0, 0.87)', mr: '5px' }}>
              Admin-mode:
            </Typography>
            <Switch data-cy="adminmode-enable" checked={Boolean(user.adminMode)} onChange={handleAdminModeToggle} />
          </Box>
        ) : null}

        {window.localStorage.getItem('adminLoggedInAs') ? (
          <Button data-cy="sign-in-as" variant="contained" color="success" onClick={handleUnhijack} sx={{ mx: 1 }}>
            Unhijack
          </Button>
        ) : (
          <FakeShibboMenu />
        )}

        <Button data-cy="nav-logout" onClick={handleLogout} sx={itemStyle('log-out')}>
          Log out
        </Button>
      </Toolbar>
    </AppBar>
  )
}
