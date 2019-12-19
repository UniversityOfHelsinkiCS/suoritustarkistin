import React, { useState } from 'react'
import { Menu, Header } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  logoutAction,
  activateAdminModeAction,
  disableAdminModeAction
} from 'Utilities/redux/userReducer'
import { images } from 'Utilities/common'
import { Link } from 'react-router-dom'

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

  const handleItemClick = (e, { name }) => setActiveItem(name)

  const getAdminButton = () => {
    return user.adminMode ? (
      <Menu.Item onClick={handleAdminModeToggle} style={{ color: 'red' }}>
        <Header as="h4">AdminMode</Header>
        <p>ENGAGED!</p>
      </Menu.Item>
    ) : (
      <Menu.Item onClick={handleAdminModeToggle}>AdminMode: off</Menu.Item>
    )
  }

  const CoursesButton = () => {
    return (
      <Menu.Item
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

  if (!user) return null
  return (
    <Menu stackable size="huge" fluid>
      <Menu.Item style={{ fontSize: 'xx-large', padding: '0.5em' }}>
        <img
          src={images.toska_color}
          style={{ marginRight: '1em' }}
          alt="tosca"
        />{' '}
        SUORITUSTARKISTIN
      </Menu.Item>

      <Menu.Item
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
      {user.isAdmin ? getAdminButton() : null}
      <Menu.Item name="log-out" onClick={handleLogout}>
        Log out
      </Menu.Item>
    </Menu>
  )
}
