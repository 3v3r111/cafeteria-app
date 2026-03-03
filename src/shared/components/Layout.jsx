import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../modules/auth/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { supabase, syncBus } from '../lib/supabase'
import NotificationCenter from './NotificationCenter'
import {
  LayoutGrid, BookOpen, CreditCard,
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
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications(profile?.role)

  const navItems = NAV_ITEMS[profile?.role] ?? []
  const showNotifications = profile?.role === 'admin' || profile?.role === 'waiter'

  const reconnect = useCallback(() => {
    setRealtimeStatus('connecting')
    try {
      supabase.realtime.disconnect()
      setTimeout(() => {
        supabase.realtime.connect()
        setRealtimeStatus('open')
        syncBus.emit()
      }, 800)
    } catch (e) {
      setRealtimeStatus('closed')
    }
  }, [])

  useEffect(() => {
    try {
      const state = supabase.realtime.connectionState()
      setRealtimeStatus(state ?? 'open')
    } catch {
      setRealtimeStatus('open')
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') reconnect()
    }
    function handleOnline() { reconnect() }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)

    const interval = setInterval(() => {
      try {
        const state = supabase.realtime.connectionState()
        setRealtimeStatus(state ?? 'open')
        if (state && state !== 'open') reconnect()
      } catch {
        setRealtimeStatus('open')
      }
    }, 30000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
    }
  }, [reconnect])

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col',
        'transform transition-transform duration-300 ease-in-out',
        'lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Header sidebar — SIN NotificationCenter */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Cafetería</p>
              <p className="text-gray-400 text-xs">Sistema interno</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
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

        {/* Indicador Realtime */}
        <div className="px-4 py-2 border-b border-gray-700">
          <button type="button" onClick={reconnect}
            className="flex items-center gap-2 w-full text-xs"
            title="Click para reconectar">
            <span className={clsx(
              'w-2 h-2 rounded-full flex-shrink-0',
              realtimeStatus === 'open'
                ? 'bg-emerald-500'
                : realtimeStatus === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-red-500 animate-pulse'
            )} />
            <span className={realtimeStatus === 'open' ? 'text-gray-500' : 'text-amber-400'}>
              {realtimeStatus === 'open'
                ? 'Sincronizado'
                : realtimeStatus === 'connecting'
                ? 'Conectando...'
                : 'Sin conexión · reconectar'}
            </span>
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink to={to} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Cerrar sesión */}
        <div className="px-3 py-4 border-t border-gray-700">
          <button onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                       text-gray-400 hover:bg-red-500 hover:text-white
                       transition-colors duration-150 text-sm">
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar — siempre visible, contiene notificaciones */}
        <header className="bg-white border-b border-gray-200 px-4 py-3
                           flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Botón abrir sidebar — solo móvil */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors">
              <Menu size={24} />
            </button>
            <span className="lg:hidden font-semibold text-gray-800">Cafetería</span>
          </div>

          {/* Notificaciones en topbar derecho */}
          {showNotifications ? (
            <NotificationCenter
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClear={clearAll}
            />
          ) : (
            <div />
          )}
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}