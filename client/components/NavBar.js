import React, { useState } from 'react'
import { Menu, Label, Radio } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  logoutAction,
  activateAdminModeAction,
  disableAdminModeAction
} from 'Utilities/redux/userReducer'
import { images } from 'Utilities/common'
import { Link } from 'react-router-dom'
import FakeShibboMenu from './fakeShibboMenu'

export default () => {
  const [activeItem, setActiveItem] = useState('newReport')
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user.data)

  const handleLogout = () => {
    dispatch(logoutAction())
  }
  const handleAdminModeToggle = () => {
    user.adminMode
      ? dispatch(disableAdminModeAction())
      : dispatch(activateAdminModeAction())
  }

  const handleItemClick = (e, { name }) => name === "logo" ? setActiveItem('') : setActiveItem(name)

  const getAdminButton = () => {
    return (
      <Menu.Item>
        <span style={{ fontSize: "0.85em", marginRight: "5px"}}>Admin-mode:</span>
        <Radio
          data-cy="adminmode-enable"
          toggle
          checked={user.adminMode}
          onClick={handleAdminModeToggle}
        />
      </Menu.Item>
    )
  }

  const getSandboxButton = () => {
    return (
      <Menu.Item
        data-cy="nav-sandbox"
        as={Link}
        to={'/sandbox'}
        name="sandbox"
        active={activeItem === 'sandbox'}
        onClick={handleItemClick}
      >
        Sandbox
      </Menu.Item>
    )
  }

  const CoursesButton = () => {
    return (
      <Menu.Item
        data-cy="nav-courses"
        as={Link}
        to={'/courses'}
        name="editCourses"
        active={activeItem === 'editCourses'}
        onClick={handleItemClick}
      >
        Edit courses
      </Menu.Item>
    )
  }

  const UsersButton = () => {
    return (
      <Menu.Item
        data-cy="nav-users"
        as={Link}
        to={'/users'}
        name="editUsers"
        active={activeItem === 'editUsers'}
        onClick={handleItemClick}
      >
        Edit users
      </Menu.Item>
    )
  }

  const AutomatedReportsButton = () => {
    return (
      <Menu.Item
        data-cy="nav-jobs"
        as={Link}
        to={'/automated-reports'}
        name="automated-reports"
        active={activeItem === 'automated-reports'}
        onClick={handleItemClick}
      >
        Automated reports
      </Menu.Item>
    )
  }

  const handleUnhijack = () => {
    window.localStorage.removeItem('adminLoggedInAs')
    window.location.reload()
  }

  const unHijackButton = () => {
    return (
      <Menu.Item data-cy="sign-in-as" onClick={handleUnhijack}>
        <Label color="green" horizontal>
          Unhijack
        </Label>
      </Menu.Item>
    )
  }

  if (!user) return null
  return (
    <Menu stackable size="huge" fluid>
      <Menu.Item 
        style={{ fontSize: 'xx-large', padding: '0.5em' }}
        as={Link}
        to={'/'}
        name="logo"
        onClick={handleItemClick}
      >
        <img
          src={images.toska_color}
          style={{ marginRight: '1em' }}
          alt="tosca"
        />{' '}
        SUOTAR
      </Menu.Item>

      <Menu.Item
        disabled={!user.isAdmin && !user.isGrader}
        data-cy="nav-new-report"
        position="right"
        as={Link}
        to={'/'}
        name="newReport"
        active={activeItem === 'newReport'}
        onClick={handleItemClick}
      >
        New report
      </Menu.Item>

      <Menu.Item
        disabled={!user.isAdmin && !user.isGrader}
        data-cy="nav-reports"
        as={Link}
        to={'/reports'}
        name="viewReports"
        active={activeItem === 'viewReports'}
        onClick={handleItemClick}
      >
        View reports
      </Menu.Item>
      {user.adminMode ? <AutomatedReportsButton /> : null}
      {user.adminMode ? <CoursesButton /> : null}
      {user.adminMode ? <UsersButton /> : null}
      {user.isAdmin ? getSandboxButton() : null}
      {user.isAdmin ? getAdminButton() : null}

      {window.localStorage.getItem('adminLoggedInAs') ? (
        unHijackButton()
      ) : (
        <FakeShibboMenu />
      )}
      <Menu.Item data-cy="nav-logout" name="log-out" onClick={handleLogout}>
        Log out
      </Menu.Item>
    </Menu>
  )
}
