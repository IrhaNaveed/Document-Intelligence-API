import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { selectIsAuthenticated, selectMustChangePassword } from '../features/auth/authSlice'

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const mustChangePassword = useSelector(selectMustChangePassword)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
