import { useAuth } from '../../modules/auth/AuthContext'

export default function UnauthorizedPage() {
  const { signOut } = useAuth()

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center bg-white rounded-xl shadow p-8">
        <h1 className="text-4xl font-bold text-red-400">403</h1>
        <p className="text-gray-700 font-semibold mt-2">Acceso no autorizado</p>
        <p className="text-gray-500 mt-1">No tienes permisos para ver esta página.</p>
        <button
          onClick={signOut}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg 
                     hover:bg-emerald-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}