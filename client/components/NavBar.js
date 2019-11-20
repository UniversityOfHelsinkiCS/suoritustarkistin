import React, { useState } from 'react'
import { Menu } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'
import { logoutAction } from 'Utilities/redux/userReducer'
import { images } from 'Utilities/common'
import { Link } from 'react-router-dom'

export default () => {
  const [activeItem, setActiveItem] = useState('newReport')
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const handleLogout = () => {
    dispatch(logoutAction())
  }

  const handleItemClick = (e, { name }) => setActiveItem(name)

  if (!user.data) return null
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

      <Menu.Item name="log-out" onClick={handleLogout}>
        Log out
      </Menu.Item>
    </Menu>
  )
}
