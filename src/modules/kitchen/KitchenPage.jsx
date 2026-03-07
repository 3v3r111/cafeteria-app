import { useState } from 'react'
import { usePageFocus } from '../../shared/hooks/usePageFocus'
import { useOrders } from '../salon/useOrders'
import { supabase } from '../../shared/lib/supabase'
import OrderTicket from './components/OrderTicket'
import { Trash2 } from 'lucide-react'

export default function KitchenPage() {
  const { orders, loading, updateOrderItemStatus, updateOrderStatus,
          clearPaidOrders, fetchAllActiveOrders } = useOrders()
  usePageFocus(() => fetchAllActiveOrders())
  const [showConfirm, setShowConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleRemoveItem(itemId) {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    if (error) {
      console.error('Error quitando item:', error)
      return
    }
    // Forzar refetch inmediato — el canal realtime puede tardar
    await fetchAllActiveOrders()
  }

  async function handleClear() {
    setClearing(true)
    await clearPaidOrders()
    setClearing(false)
    setShowConfirm(false)
  }

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
        <div className="flex items-center gap-4">
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
          {orders.length > 0 && (
            <button type="button" onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-500
                         hover:bg-red-50 border border-red-200 rounded-xl transition-colors">
              <Trash2 size={15} />
              Limpiar completadas
            </button>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                        flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              ¿Limpiar órdenes completadas?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Se eliminarán de la vista todas las órdenes donde todos los items
              estén marcados como listos. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowConfirm(false)}
                disabled={clearing}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600
                           rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleClear} disabled={clearing}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600
                           disabled:bg-red-300 text-white rounded-xl text-sm
                           transition-colors flex items-center justify-center gap-2">
                {clearing ? (
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full animate-spin" />
                ) : 'Sí, limpiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-lg font-medium">Sin órdenes pendientes</p>
          <p className="text-sm mt-1">Las nuevas órdenes aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...pendingOrders, ...readyOrders].map(order => (
            <OrderTicket
              key={order.id}
              order={order}
              onUpdateItemStatus={handleUpdateItemStatus}
              onMarkAllReady={handleMarkAllReady}
              onRemoveItem={handleRemoveItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
