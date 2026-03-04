import { useState } from 'react'
import { X, ShoppingCart, Send } from 'lucide-react'
import { useOrders } from '../useOrders'
import ProductSelector from './ProductSelector'
import clsx from 'clsx'

const ITEM_STATUS = {
  pending:   { label: 'Pendiente',  color: 'text-gray-500',    bg: 'bg-gray-100'    },
  preparing: { label: 'Preparando', color: 'text-amber-600',   bg: 'bg-amber-100'   },
  ready:     { label: 'Listo',      color: 'text-emerald-600', bg: 'bg-emerald-100' },
  delivered: { label: 'Entregado',  color: 'text-blue-600',    bg: 'bg-blue-100'    },
}

export default function OrderPanel({ table, categories, products, onClose }) {
  const { activeOrder, loading, createOrder, addItemsToOrder } = useOrders(table.id)
  const [cart, setCart] = useState([])
  const [sending, setSending] = useState(false)
  const [view, setView] = useState('menu')

  const cartTotal = cart.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  async function handleSendOrder() {
    if (cart.length === 0) return
    setSending(true)
    const ok = activeOrder
      ? await addItemsToOrder(activeOrder.id, cart)
      : await createOrder(table.id, cart)
    setSending(false)
    if (ok) { setCart([]); setView('order') }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Mesa {table.number}
              {table.name && <span className="text-gray-400 ml-1">· {table.name}</span>}
            </h2>
            <p className="text-xs text-gray-500">{table.capacity} personas</p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button type="button" onClick={() => setView('menu')}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-colors',
              view === 'menu'
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-700'
            )}>
            Agregar productos
          </button>
          <button type="button" onClick={() => setView('order')}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-colors',
              view === 'order'
                ? 'text-emerald-600 border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-700'
            )}>
            Orden activa
            {activeOrder && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700
                               text-xs rounded-full">
                {activeOrder.order_items?.length ?? 0}
              </span>
            )}
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'menu' && (
            <div className="flex-1 overflow-hidden p-4">
              <ProductSelector
                categories={categories}
                products={products}
                cart={cart}
                onUpdateCart={setCart}
              />
            </div>
          )}

          {view === 'order' && (
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500
                                  border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!loading && !activeOrder && (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay orden activa</p>
                  <p className="text-xs mt-1">Agrega productos desde el menú</p>
                </div>
              )}
              {!loading && activeOrder && (
                <div className="space-y-2">
                  {activeOrder.order_items?.map(item => {
                    const statusCfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.pending
                    return (
                      <div key={item.id}
                        className="flex items-start justify-between p-3
                                   border border-gray-100 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              x{item.quantity}
                            </span>
                            <span className="text-sm text-gray-700 truncate">
                              {item.products?.name}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-amber-600 mt-0.5 truncate">
                              📝 {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            ${(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            statusCfg.bg, statusCfg.color
                          )}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {view === 'menu' && cart.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                {cartCount} producto{cartCount !== 1 ? 's' : ''}
              </span>
              <span className="text-base font-bold text-gray-800">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <button type="button" onClick={handleSendOrder} disabled={sending}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600
                         disabled:bg-emerald-300 text-white font-semibold
                         rounded-xl transition-colors flex items-center
                         justify-center gap-2">
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent
                                rounded-full animate-spin" />
              ) : (
                <><Send size={16} />{activeOrder ? 'Agregar a orden' : 'Enviar a cocina'}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}