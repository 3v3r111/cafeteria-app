import { Navigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/useAuth'

function LoadingScreen() {
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

function ProfileErrorScreen({ onSignOut }) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white rounded-xl shadow p-8 max-w-sm">
        <p className="text-red-500 font-semibold text-lg">Error de perfil</p>
        <p className="text-gray-500 mt-2 text-sm">
          Tu cuenta no tiene un perfil asignado en el sistema. 
          Contacta al administrador.
        </p>
        <button
          onClick={onSignOut}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg 
                     hover:bg-emerald-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />

  // Hay sesión pero no hay perfil — mostrar error en lugar de redirigir
  if (!profile) return <ProfileErrorScreen onSignOut={signOut} />

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}