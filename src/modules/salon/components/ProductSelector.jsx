import { useState } from 'react'
import { Plus, Minus, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

export default function ProductSelector({ categories, products, onUpdateCart, cart }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'all')
  const [notes, setNotes] = useState({})
  const [showNoteFor, setShowNoteFor] = useState(null)

  const filtered = products.filter(p => {
    if (activeCategory === 'all') return p.is_available
    return p.category_id === activeCategory && p.is_available
  })

  function getCartItem(productId) {
    return cart.find(i => i.product_id === productId)
  }

  function handleAdd(product) {
    const existing = getCartItem(product.id)
    if (existing) {
      onUpdateCart(cart.map(i =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      onUpdateCart([...cart, {
        product_id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity: 1,
        notes: ''
      }])
    }
  }

  function handleRemove(productId) {
    const existing = getCartItem(productId)
    if (!existing) return
    if (existing.quantity === 1) {
      onUpdateCart(cart.filter(i => i.product_id !== productId))
    } else {
      onUpdateCart(cart.map(i =>
        i.product_id === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ))
    }
  }

  function handleNote(productId, note) {
    onUpdateCart(cart.map(i =>
      i.product_id === productId ? { ...i, notes: note } : i
    ))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
            activeCategory === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Productos */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No hay productos disponibles
          </p>
        )}
        {filtered.map(product => {
          const cartItem = getCartItem(product.id)
          return (
            <div key={product.id}
              className="border border-gray-100 rounded-xl p-3 hover:border-gray-200
                         transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    ${Number(product.price).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  {cartItem && (
                    <button
                      type="button"
                      onClick={() => setShowNoteFor(
                        showNoteFor === product.id ? null : product.id
                      )}
                      className={clsx(
                        'p-1.5 rounded-lg transition-colors',
                        cartItem.notes
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    {cartItem && (
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200
                                   flex items-center justify-center transition-colors"
                      >
                        <Minus size={13} />
                      </button>
                    )}

                    {cartItem && (
                      <span className="w-6 text-center text-sm font-semibold
                                       text-gray-800">
                        {cartItem.quantity}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAdd(product)}
                      className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600
                                 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Campo de nota */}
              {showNoteFor === product.id && cartItem && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={cartItem.notes || ''}
                    onChange={e => handleNote(product.id, e.target.value)}
                    placeholder="Ej: sin cebolla, extra caliente..."
                    className="w-full px-2.5 py-1.5 text-xs border border-amber-200
                               rounded-lg focus:outline-none focus:ring-2
                               focus:ring-amber-300 bg-amber-50"
                    autoFocus
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}