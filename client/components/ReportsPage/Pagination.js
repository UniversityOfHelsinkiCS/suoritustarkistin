import React from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { useDispatch, useSelector } from 'react-redux'

const styles = {
  display: 'flex',
  justifyContent: 'center',
  margin: '2rem 0 1rem 0'
}

/**
 * Component for pagination buttons
 * @param reduxKey key for state.sisReports where to get offset and limit
 * @param action action which fetches data, takes offset and limit
 * @returns
 */
const Pagination = ({ reduxKey, action }) => {
  const { offset, limit, count } = useSelector((state) => state.sisReports[reduxKey])
  const dispatch = useDispatch()

  const fetch = (offset) => dispatch(action(offset, limit))

  return <div style={styles}>
    <Button.Group>
      <Button disabled={offset === 0} labelPosition="left" onClick={() => fetch(offset - limit)} icon>
        Newer
        <Icon name='left arrow' />
      </Button>
      <Button disabled={offset + limit >= count} onClick={() => fetch(offset + limit)} labelPosition="right" icon>
        Older
        <Icon name='right arrow' />
      </Button>
    </Button.Group>
  </div>
}

export default Pagination
