import { useState, useEffect } from 'react'
import { Users, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '../../../shared/lib/supabase'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  free:     { label: 'Libre',     bg: 'bg-emerald-50',  border: 'border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  occupied: { label: 'Ocupada',   bg: 'bg-red-50',      border: 'border-red-200',     dot: 'bg-red-500',     text: 'text-red-700'     },
  waiting:  { label: 'En espera', bg: 'bg-amber-50',    border: 'border-amber-200',   dot: 'bg-amber-500',   text: 'text-amber-700'   },
}

export default function TableCard({ table, isAdmin, onSelect, onEdit, onDelete, onStatusChange }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [hasActiveOrder, setHasActiveOrder] = useState(false)
  const config = STATUS_CONFIG[table.status] ?? STATUS_CONFIG.free

  // Verificar si hay orden activa en esta mesa
  useEffect(() => {
    async function checkActiveOrder() {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', table.id)
        .in('status', ['pending', 'preparing', 'ready', 'delivered'])
        .limit(1)

      setHasActiveOrder(data && data.length > 0)
    }
    checkActiveOrder()
  }, [table.id, table.status])

  const otherStatuses = Object.entries(STATUS_CONFIG)
    .filter(([key]) => key !== table.status)

  async function handleStatusChange(e, newStatus) {
    e.stopPropagation()
    setShowStatusMenu(false)

    if (hasActiveOrder && newStatus !== 'occupied') {
      toast.error('Esta mesa tiene una orden activa. Finaliza el pago antes de cambiar el estado.')
      return
    }

    await onStatusChange(table.id, newStatus)
  }

  return (
    <div
      onClick={() => onSelect(table)}
      className={clsx(
        'relative rounded-2xl border-2 p-4 cursor-pointer group',
        'transition-all duration-200 hover:shadow-md hover:scale-105',
        config.bg, config.border
      )}
    >
      {/* Botones admin */}
      {isAdmin && (
        <div
          className="absolute top-2 right-2 flex gap-1 opacity-0
                      group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onEdit(table)}
            className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400
                       hover:text-emerald-600 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(table.id)}
            className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400
                       hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      {/* Número de mesa */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-800">{table.number}</p>
        {table.name && (
          <p className="text-xs text-gray-500 mt-0.5">{table.name}</p>
        )}
      </div>

      {/* Capacidad */}
      <div className="flex items-center gap-1.5 mb-3">
        <Users size={13} className="text-gray-400" />
        <span className="text-xs text-gray-500">{table.capacity} personas</span>
      </div>

      {/* Estado con dropdown */}
      <div className="relative" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit',
            'bg-white bg-opacity-70 hover:bg-opacity-100 transition-all',
            hasActiveOrder && 'cursor-not-allowed opacity-75'
          )}
        >
          <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
          <span className={clsx('text-xs font-medium', config.text)}>
            {config.label}
          </span>
          {hasActiveOrder ? (
            <span className="text-xs ml-0.5">🔒</span>
          ) : (
            <ChevronDown size={11} className={clsx(
              'transition-transform', config.text,
              showStatusMenu && 'rotate-180'
            )} />
          )}
        </button>

        {/* Menú de estados */}
        {showStatusMenu && (
          <div className="absolute bottom-full mb-1 left-0 bg-white rounded-xl
                          shadow-lg border border-gray-100 overflow-hidden z-10 min-w-40">
            {hasActiveOrder ? (
              <div className="px-3 py-2.5">
                <p className="text-xs text-gray-500 text-center">
                  🔒 Orden activa en curso
                </p>
              </div>
            ) : (
              otherStatuses.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => handleStatusChange(e, key)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs
                             hover:bg-gray-50 transition-colors"
                >
                  <span className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
                  <span className={cfg.text}>{cfg.label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}