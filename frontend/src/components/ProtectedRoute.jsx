import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from './Loading'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isReady, user } = useAuth()

  if (!isReady) {
    return <Loading message="Checking access..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'staff' && !user?.is_staff) {
    return <Navigate to="/" replace />
  }

  if (requiredRole === 'admin' && !user?.is_superuser) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
