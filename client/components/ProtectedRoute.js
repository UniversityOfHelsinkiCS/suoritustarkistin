import React from 'react'
import { useSelector } from 'react-redux'
import { Redirect, Route } from 'react-router-dom'

const ProtectedRoute = ({ component: Component, ...rest }) => {
  const user = useSelector((state) => state.user)
  const hasPermissions = user.data.isAdmin || user.data.isGrader

  return (
    <Route
      {...rest}
      render={(props) => {
        if (hasPermissions) {
          return <Component {...rest} {...props} />
        } 
          return (
            <Redirect
              to={{
                pathname: '/unauthorized',
                state: {
                  from: props.location
                }
              }}
            />
          )
        
      }}
    />
  )
}

export default ProtectedRoute
