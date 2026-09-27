import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

import { selectIsAuthenticated } from '../features/auth/authSlice'

export default function PublicOnlyRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
