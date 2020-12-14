import React, { useState } from 'react'
import { Menu, Header, Label } from 'semantic-ui-react'
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
    return user.adminMode ? (
      <Menu.Item
        data-cy="adminmode-disable"
        onClick={handleAdminModeToggle}
        style={{ color: 'red' }}
      >
        <Header as="h4">AdminMode</Header>
        <p>ENGAGED!</p>
      </Menu.Item>
    ) : (
      <Menu.Item data-cy="adminmode-enable" onClick={handleAdminModeToggle}>
        AdminMode: off
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

  const JobsButton = () => {
    return (
      <Menu.Item
        data-cy="nav-jobs"
        as={Link}
        to={'/jobs'}
        name="cronjobs"
        active={activeItem === 'cronjobs'}
        onClick={handleItemClick}
      >
        Cronjobs
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
      {user.adminMode ? <CoursesButton /> : null}
      {user.adminMode ? <UsersButton /> : null}
      {user.adminMode ? <JobsButton /> : null}
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
