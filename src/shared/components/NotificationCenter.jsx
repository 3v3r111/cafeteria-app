import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Trash2, Clock } from 'lucide-react'
import clsx from 'clsx'

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return 'Ahora'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  return `${hours}h`
}

export default function NotificationCenter({
  notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClear
}) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>

      {/* Botón campana */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-500 hover:text-gray-800
                   hover:bg-gray-100 rounded-xl transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500
                           text-white text-xs font-bold rounded-full
                           flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel — absolute desde el botón */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl
                        shadow-2xl border border-gray-100 z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-600" />
              <span className="font-semibold text-gray-800 text-sm">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600
                                 text-xs font-medium rounded-full">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button type="button" onClick={onMarkAllAsRead}
                  className="p-1.5 text-gray-400 hover:text-emerald-600
                             hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Marcar todas como leídas">
                  <CheckCheck size={14} />
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" onClick={onClear}
                  className="p-1.5 text-gray-400 hover:text-red-500
                             hover:bg-red-50 rounded-lg transition-colors"
                  title="Limpiar todas">
                  <Trash2 size={14} />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 rounded-lg transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell size={28} className="opacity-30 mb-2" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} onClick={() => onMarkAsRead(notif.id)}
                  className={clsx(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer',
                    'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    !notif.read && 'bg-emerald-50 hover:bg-emerald-100'
                  )}>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center
                                  justify-center flex-shrink-0 mt-0.5">
                    <span className="text-base">🍽️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      <span className="font-medium text-emerald-700">
                        x{notif.quantity} {notif.productName}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">📍 {notif.tableLabel}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock size={10} />
                      <span className="text-xs">{timeAgo(notif.timestamp)}</span>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''} en total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}