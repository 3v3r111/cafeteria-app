import { useState } from 'react'
import { Clock, CheckCircle, Trash2 } from 'lucide-react'
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

export default function OrderTicket({ order, onUpdateItemStatus, onMarkAllReady, onRemoveItem }) {
  const [removingId, setRemovingId] = useState(null)
  const [removing, setRemoving] = useState(false)

  const allReady = order.order_items?.every(i =>
    i.status === 'ready' || i.status === 'delivered'
  )
  const pendingItems = order.order_items?.filter(i =>
    i.status === 'pending' || i.status === 'preparing'
  ) ?? []

  async function handleRemove(itemId) {
    setRemoving(true)
    await onRemoveItem(itemId)
    setRemoving(false)
    setRemovingId(null)
  }

  return (
    <div className={clsx(
      'bg-white rounded-2xl border-2 overflow-hidden',
      allReady ? 'border-emerald-300' : 'border-gray-200'
    )}>

      {/* Header */}
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
          <button type="button" onClick={() => onMarkAllReady(order)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600
                       text-white text-xs font-medium rounded-lg transition-colors
                       flex items-center gap-1.5">
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
          const isRemoving = removingId === item.id

          return (
            <div key={item.id}>
              <div className={clsx(
                'flex items-start justify-between p-2.5 rounded-xl transition-colors',
                isRemoving
                  ? 'bg-red-50 border border-red-200'
                  : isDone
                  ? 'bg-gray-50 opacity-60'
                  : 'bg-white border border-gray-100'
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

                <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                  {/* Botón cambiar estado */}
                  {!isDone && !isRemoving && (
                    <button type="button"
                      onClick={() => onUpdateItemStatus(
                        item.id,
                        item.status === 'pending' ? 'preparing' : 'ready'
                      )}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                        item.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      )}>
                      {item.status === 'pending' ? 'Iniciar' : 'Listo ✓'}
                    </button>
                  )}

                  {/* Botón quitar — solo si no está listo/entregado */}
                  {!isDone && (
                    <button type="button"
                      onClick={() => setRemovingId(isRemoving ? null : item.id)}
                      className={clsx(
                        'p-1.5 rounded-lg transition-colors',
                        isRemoving
                          ? 'text-red-500 bg-red-100'
                          : 'text-gray-300 hover:text-red-400 hover:bg-red-50'
                      )}
                      title="Quitar producto">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmar eliminación inline */}
              {isRemoving && (
                <div className="mt-1 px-2.5 pb-2 space-y-1.5">
                  <p className="text-xs text-red-600">
                    ¿Quitar <strong>{item.products?.name}</strong>?
                  </p>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setRemovingId(null)}
                      className="flex-1 py-1.5 text-xs text-gray-600
                                 border border-gray-200 rounded-lg
                                 hover:bg-gray-50 transition-colors">
                      No
                    </button>
                    <button type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={removing}
                      className="flex-1 py-1.5 text-xs text-white bg-red-500
                                 hover:bg-red-600 disabled:bg-red-300 rounded-lg
                                 transition-colors flex items-center justify-center gap-1">
                      {removing ? (
                        <div className="w-3 h-3 border border-white
                                        border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Trash2 size={11} /> Sí, quitar</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}