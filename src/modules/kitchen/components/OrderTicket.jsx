import { Clock, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

const ITEM_STATUS = {
  pending:   { label: 'Pendiente',  color: 'text-gray-500',    bg: 'bg-gray-100'    },
  preparing: { label: 'Preparando', color: 'text-amber-600',   bg: 'bg-amber-100'   },
  ready:     { label: 'Listo',      color: 'text-emerald-600', bg: 'bg-emerald-100' },
  delivered: { label: 'Entregado',  color: 'text-blue-600',    bg: 'bg-blue-100'    },
}

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (mins < 1) return 'Ahora'
  if (mins === 1) return '1 min'
  return `${mins} min`
}

export default function OrderTicket({ order, onUpdateItemStatus, onMarkAllReady }) {
  const allReady = order.order_items?.every(i =>
    i.status === 'ready' || i.status === 'delivered'
  )

  const pendingItems = order.order_items?.filter(i =>
    i.status === 'pending' || i.status === 'preparing'
  ) ?? []

  return (
    <div className={clsx(
      'bg-white rounded-2xl border-2 overflow-hidden',
      allReady ? 'border-emerald-300' : 'border-gray-200'
    )}>

      {/* Header del ticket */}
      <div className={clsx(
        'px-4 py-3 flex items-center justify-between',
        allReady ? 'bg-emerald-50' : 'bg-gray-50'
      )}>
        <div>
          <p className="font-bold text-gray-800 text-lg">
            Mesa {order.tables?.number}
            {order.tables?.name && (
              <span className="text-sm font-normal text-gray-500 ml-1">
                · {order.tables.name}
              </span>
            )}
          </p>
          <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
            <Clock size={11} />
            <span>{timeAgo(order.created_at)}</span>
          </div>
        </div>

        {pendingItems.length > 0 && (
          <button
            type="button"
            onClick={() => onMarkAllReady(order)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600
                       text-white text-xs font-medium rounded-lg transition-colors
                       flex items-center gap-1.5"
          >
            <CheckCircle size={13} />
            Todo listo
          </button>
        )}
      </div>

      {/* Items */}
      <div className="p-3 space-y-2">
        {order.order_items?.map(item => {
          const cfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.pending
          const isDone = item.status === 'ready' || item.status === 'delivered'

          return (
            <div key={item.id}
              className={clsx(
                'flex items-start justify-between p-2.5 rounded-xl transition-colors',
                isDone ? 'bg-gray-50 opacity-60' : 'bg-white border border-gray-100'
              )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                    x{item.quantity}
                  </span>
                  <span className={clsx(
                    'text-sm font-medium truncate',
                    isDone ? 'line-through text-gray-400' : 'text-gray-800'
                  )}>
                    {item.products?.name}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-amber-600 mt-0.5 ml-6">
                    📝 {item.notes}
                  </p>
                )}
              </div>

              {/* Botón cambiar estado */}
              {!isDone && (
                <button
                  type="button"
                  onClick={() => onUpdateItemStatus(
                    item.id,
                    item.status === 'pending' ? 'preparing' : 'ready'
                  )}
                  className={clsx(
                    'ml-2 px-2.5 py-1 rounded-lg text-xs font-medium',
                    'flex-shrink-0 transition-colors',
                    item.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  )}
                >
                  {item.status === 'pending' ? 'Iniciar' : 'Listo ✓'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}