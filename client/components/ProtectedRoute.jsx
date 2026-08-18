import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const user = useSelector((state) => state.user)
  const hasPermissions = user.data.isAdmin || user.data.isGrader

  if (!hasPermissions) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
