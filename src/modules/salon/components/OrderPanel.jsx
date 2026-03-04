import { useState } from 'react'
import { X, ShoppingCart, Send, Trash2, CreditCard } from 'lucide-react'
import { useOrders } from '../useOrders'
import ProductSelector from './ProductSelector'
import clsx from 'clsx'

const ITEM_STATUS = {
  pending:   { label: 'Pendiente',  color: 'text-gray-500',    bg: 'bg-gray-100'    },
  preparing: { label: 'Preparando', color: 'text-amber-600',   bg: 'bg-amber-100'   },
  ready:     { label: 'Listo',      color: 'text-emerald-600', bg: 'bg-emerald-100' },
  delivered: { label: 'Entregado',  color: 'text-blue-600',    bg: 'bg-blue-100'    },
}

export default function OrderPanel({ table, categories, products, onClose, onGoToPayment }) {
  const { activeOrder, loading, createOrder, addItemsToOrder } = useOrders(table.id)
  const [cart, setCart] = useState([])
  const [sending, setSending] = useState(false)
  const [view, setView] = useState('menu')
  const [removingItem, setRemovingItem] = useState(null)
  const [removing, setRemoving] = useState(false)

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

  async function handleRemoveItem(itemId) {
    setRemoving(true)
    const { supabase } = await import('../../../shared/lib/supabase')
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    setRemoving(false)
    if (!error) setRemovingItem(null)
  }

  // Agrega la función después de handleRemoveItem
  async function handleCancelOrder() {
    if (!activeOrder) return
    const { supabase } = await import('../../../shared/lib/supabase')

    // Eliminar todos los items
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', activeOrder.id)

    // El trigger se encarga de cancelar la orden y liberar la mesa
    onClose()
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
                    const isRemoving = removingItem?.id === item.id
                    return (
                      <div key={item.id}
                        className={clsx(
                          'border rounded-xl transition-colors',
                          isRemoving ? 'border-red-200 bg-red-50' : 'border-gray-100'
                        )}>
                        <div className="flex items-start justify-between p-3">
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
                            {/* Quitar item — admin y mesero */}
                            <button
                              type="button"
                              onClick={() => setRemovingItem(isRemoving ? null : item)}
                              className={clsx(
                                'p-1.5 rounded-lg transition-colors',
                                isRemoving
                                  ? 'text-red-500 bg-red-100'
                                  : 'text-gray-400 hover:text-red-400 hover:bg-red-50'
                              )}
                              title="Quitar producto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Confirmar eliminación */}
                        {isRemoving && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-red-600 mb-2">
                              ¿Quitar <strong>{item.products?.name}</strong> de la orden?
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setRemovingItem(null)}
                                className="flex-1 py-1.5 text-xs text-gray-600
                                           border border-gray-200 rounded-lg
                                           hover:bg-gray-50 transition-colors"
                              >
                                No, cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removing}
                                className="flex-1 py-1.5 text-xs text-white bg-red-500
                                           hover:bg-red-600 disabled:bg-red-300 rounded-lg
                                           transition-colors flex items-center
                                           justify-center gap-1"
                              >
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
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50">
          {view === 'order' && activeOrder && (
            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => { onClose(); onGoToPayment?.() }}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600
                          text-white font-semibold rounded-xl transition-colors
                          flex items-center justify-center gap-2 text-sm"
              >
                <CreditCard size={16} />
                Ir a cobrar
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                className="w-full py-2.5 border border-red-200 text-red-500
                          hover:bg-red-50 rounded-xl text-sm transition-colors"
              >
                Cancelar orden y liberar mesa
              </button>
            </div>
          )}
          {view === 'menu' && cart.length > 0 && (
            <div className="p-4">
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
    </div>
  )
}