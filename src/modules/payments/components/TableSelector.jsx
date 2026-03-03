import { Users, Clock } from 'lucide-react'
import clsx from 'clsx'

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}min`
}

function getOrderTotal(orders) {
  return orders.reduce((sum, order) =>
    sum + order.order_items.reduce((s, item) =>
      s + (item.unit_price * item.quantity), 0
    ), 0
  )
}

export default function TableSelector({ tables, selectedTable, onSelect }) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <p className="text-lg font-medium">Sin mesas ocupadas</p>
        <p className="text-sm mt-1">Las mesas con órdenes activas aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 
                    xl:grid-cols-3 gap-3">
      {tables.map(table => {
        const activeOrder = table.orders?.[0]
        const total = getOrderTotal(table.orders ?? [])
        const isSelected = selectedTable?.id === table.id
        const itemCount = table.orders?.reduce((sum, o) =>
          sum + o.order_items.length, 0) ?? 0

        return (
          <button
            key={table.id}
            type="button"
            onClick={() => onSelect(table)}
            className={clsx(
              'text-left p-4 rounded-2xl border-2 transition-all',
              'hover:shadow-md hover:scale-105',
              isSelected
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {table.number}
                </p>
                {table.name && (
                  <p className="text-xs text-gray-500">{table.name}</p>
                )}
              </div>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1" />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Users size={11} />
              <span>{itemCount} producto{itemCount !== 1 ? 's' : ''}</span>
            </div>

            {activeOrder && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Clock size={11} />
                <span>{timeAgo(activeOrder.created_at)}</span>
              </div>
            )}

            <p className="text-base font-bold text-emerald-600">
              ${total.toFixed(2)}
            </p>
          </button>
        )
      })}
    </div>
  )
}