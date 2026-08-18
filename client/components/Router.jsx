import ApiChecks from '@client/components/ApiChecks'
import AutomatedReportsPage from '@client/components/AutomatedReportsPage'
import CoursesPage from '@client/components/CoursesPage'
import NewReportPage from '@client/components/NewReportPage'
import ProtectedRoute from '@client/components/ProtectedRoute'
import ReportsPage from '@client/components/ReportsPage'
import SandboxPage from '@client/components/SandboxPage'
import UnauthorizedPage from '@client/components/UnauthorizedPage'
import UsersPage from '@client/components/UsersPage'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

// HACK to make component full page width or narrow
const Wrap = ({ children, narrow }) => <div className={narrow ? `sitecontent-narrow` : 'sitecontent'}>{children}</div>

const protect = (Component, narrow) => (
  <ProtectedRoute>
    <Wrap narrow={narrow}>
      <Component />
    </Wrap>
  </ProtectedRoute>
)

export default () => (
  <Routes>
    <Route path="/" element={protect(NewReportPage, true)} />
    <Route path="/reports" element={protect(ReportsPage, true)} />
    <Route path="/reports/sisu/:activeBatch" element={protect(ReportsPage, true)} />
    <Route path="/courses" element={protect(CoursesPage)} />
    <Route path="/users" element={protect(UsersPage, true)} />
    <Route path="/automated-reports" element={protect(AutomatedReportsPage)} />
    <Route path="/apichecks" element={protect(ApiChecks, true)} />
    <Route path="/sandbox" element={protect(SandboxPage, true)} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route path="*" element={<div>Page not found!</div>} />
  </Routes>
)
