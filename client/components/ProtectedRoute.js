import React from 'react'
import { useSelector } from "react-redux"
import { Route, Redirect } from 'react-router-dom'

export default function ProtectedRoute({ component: Component, ...rest })  {
  const user = useSelector((state) => state.user)
  const hasPermissions = (user.data.isAdmin || user.data.isGrader) 

    return (
      <Route {...rest} render={
        (props) => {
          if (hasPermissions) {
            return <Component {...rest} {...props} />
          } else {
            return <Redirect to={
              {
                pathname: '/unauthorized',
                state: {
                  from: props.location
                }
              }
            } />
          }
        }
      } />
    )
}
