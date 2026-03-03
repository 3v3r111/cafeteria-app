import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import NotificationCenter from './NotificationCenter'
import {
  LayoutGrid, UtensilsCrossed, BookOpen, CreditCard,
  Package, BarChart2, Tag, LogOut, Menu, X, ChefHat
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = {
  admin: [
    { to: '/salon',       icon: LayoutGrid, label: 'Salón y Mesas'  },
    { to: '/cocina',      icon: ChefHat,    label: 'Cocina'          },
    { to: '/menu',        icon: BookOpen,   label: 'Menú'            },
    { to: '/pagos',       icon: CreditCard, label: 'Pagos y Caja'   },
    { to: '/inventario',  icon: Package,    label: 'Inventario'      },
    { to: '/finanzas',    icon: BarChart2,  label: 'Finanzas'        },
    { to: '/promociones', icon: Tag,        label: 'Promociones'     },
  ],
  waiter: [
    { to: '/salon', icon: LayoutGrid, label: 'Salón y Mesas' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos y Caja'  },
  ],
  kitchen: [
    { to: '/cocina', icon: ChefHat, label: 'Cocina' },
  ],
}

const ROLE_LABEL = {
  admin:   'Administrador',
  waiter:  'Mesero',
  kitchen: 'Cocina',
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications(profile?.role)

  const navItems = NAV_ITEMS[profile?.role] ?? []
  const showNotifications = profile?.role === 'admin' || profile?.role === 'waiter'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col',
        'transform transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Header sidebar */}
        <div className="flex items-center justify-between px-6 py-5
                        border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Cafetería</p>
              <p className="text-gray-400 text-xs">Sistema interno</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Campana de notificaciones en sidebar */}
            {showNotifications && (
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClear={clearAll}
              />
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Perfil */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center
                            justify-center text-white font-semibold text-sm">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-emerald-400 text-xs">{ROLE_LABEL[profile?.role]}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm',
                    'transition-colors duration-150',
                    isActive
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Cerrar sesión */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                       text-gray-400 hover:bg-red-500 hover:text-white
                       transition-colors duration-150 text-sm"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar móvil */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3
                           flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-semibold text-gray-800">Cafetería</span>
          </div>
          {showNotifications && (
            <div className="[&_button]:text-gray-600 [&_button:hover]:text-gray-900
                            [&_button:hover]:bg-gray-100">
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onClear={clearAll}
              />
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}