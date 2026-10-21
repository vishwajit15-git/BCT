import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#003087] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-[#4a5568]">Validating MediChain session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="card text-center py-12 max-w-lg mx-auto bg-white border border-[#d1dbe5] rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[#00205b] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Access Restricted
        </h2>
        <p className="text-sm text-[#4a5568] mb-4">
          This portal is restricted to {allowedRoles.join(' or ')} accounts. Your account role is{' '}
          <span className="font-semibold text-[#003087]">{user.role}</span>.
        </p>
        <Navigate to="/" replace />
      </div>
    )
  }

  return children
}
