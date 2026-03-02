import { Navigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  // Mientras carga la sesión, no renderizar nada
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent 
                          rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-3">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si hay roles requeridos y el usuario no los tiene, redirigir
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}