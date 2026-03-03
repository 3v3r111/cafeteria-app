import { useOrders } from '../salon/useOrders'
import OrderTicket from './components/OrderTicket'

export default function KitchenPage() {
  const { orders, loading, updateOrderItemStatus, updateOrderStatus } = useOrders()

  async function handleUpdateItemStatus(itemId, status) {
    await updateOrderItemStatus(itemId, status)
  }

  async function handleMarkAllReady(order) {
    for (const item of order.order_items) {
      if (item.status !== 'ready' && item.status !== 'delivered') {
        await updateOrderItemStatus(item.id, 'ready')
      }
    }
    await updateOrderStatus(order.id, 'ready')
  }

  const pendingOrders = orders.filter(o =>
    o.order_items?.some(i => i.status !== 'ready' && i.status !== 'delivered')
  )

  const readyOrders = orders.filter(o =>
    o.order_items?.length > 0 &&
    o.order_items?.every(i => i.status === 'ready' || i.status === 'delivered')
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cocina</h1>
          <p className="text-gray-500 mt-1">
            {pendingOrders.length} orden{pendingOrders.length !== 1 ? 'es' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''}
          </p>
        </div>
        {orders.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">{pendingOrders.length} en proceso</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">{readyOrders.length} listos</span>
            </span>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-lg font-medium">Sin órdenes pendientes</p>
          <p className="text-sm mt-1">Las nuevas órdenes aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Primero las pendientes, luego las listas */}
          {[...pendingOrders, ...readyOrders].map(order => (
            <OrderTicket
              key={order.id}
              order={order}
              onUpdateItemStatus={handleUpdateItemStatus}
              onMarkAllReady={handleMarkAllReady}
            />
          ))}
        </div>
      )}
    </div>
  )
}