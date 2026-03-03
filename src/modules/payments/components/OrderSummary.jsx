import clsx from 'clsx'

const ITEM_STATUS = {
  pending:   { label: 'Pendiente',  color: 'text-gray-400'    },
  preparing: { label: 'Preparando', color: 'text-amber-500'   },
  ready:     { label: 'Listo',      color: 'text-emerald-500' },
  delivered: { label: 'Entregado',  color: 'text-blue-500'    },
}

export default function OrderSummary({ table }) {
  const orders = table?.orders ?? []
  const allItems = orders.flatMap(o => o.order_items ?? [])

  return (
    <div className="flex-1 overflow-y-auto">
      {allItems.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          Sin productos en la orden
        </p>
      ) : (
        <div className="space-y-1.5">
          {allItems.map(item => {
            const statusCfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.pending
            return (
              <div key={item.id}
                className="flex items-start justify-between py-2
                           border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-600
                                     flex-shrink-0">
                      x{item.quantity}
                    </span>
                    <span className="text-sm text-gray-800 truncate">
                      {item.products?.name}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-amber-600 mt-0.5 ml-6 truncate">
                      📝 {item.notes}
                    </p>
                  )}
                  <p className={clsx('text-xs mt-0.5 ml-6', statusCfg.color)}>
                    {statusCfg.label}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-700 ml-3 flex-shrink-0">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}