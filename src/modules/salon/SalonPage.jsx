import { useAuth } from '../../modules/auth/useAuth'

export default function SalonPage() {
  const { signOut, profile } = useAuth()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Salón y Mesas</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            {profile?.name} — {profile?.role}
          </span>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-red-500 text-white rounded-lg 
                       hover:bg-red-600 transition-colors text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}