import { useState } from 'react'
import { Plus, Minus, MessageSquare, Tag } from 'lucide-react'
import clsx from 'clsx'

export default function ProductSelector({ categories, products, onUpdateCart, cart,
                                          activePromotions = [] }) {
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

  // Devuelve la promo activa de tipo 'product' para un producto dado
  function getProductPromo(productId) {
    return activePromotions.find(p =>
      p.applies_to === 'product' && p.product_id === productId
    ) ?? null
  }

  // Precio con descuento aplicado
  function getDiscountedPrice(product, promo) {
    if (!promo) return null
    if (promo.type === 'percentage') {
      return product.price * (1 - promo.value / 100)
    }
    return Math.max(product.price - promo.value, 0)
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
      const promo = getProductPromo(product.id)
      const effectivePrice = promo
        ? getDiscountedPrice(product, promo)
        : product.price

      onUpdateCart([...cart, {
        product_id:  product.id,
        name:        product.name,
        unit_price:  effectivePrice,
        original_price: product.price,
        promo_id:    promo?.id ?? null,
        promo_name:  promo?.name ?? null,
        quantity:    1,
        notes:       ''
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

  // Promociones de orden (aplican al total) — mostrar banner
  const orderPromos = activePromotions.filter(p => p.applies_to === 'order')

  return (
    <div className="flex flex-col h-full">

      {/* Banner de promos de orden */}
      {orderPromos.length > 0 && (
        <div className="mb-2 px-3 py-2 bg-emerald-50 border border-emerald-200
                        rounded-xl flex items-start gap-2 flex-shrink-0">
          <Tag size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">
              Promoción{orderPromos.length > 1 ? 'es' : ''} activa{orderPromos.length > 1 ? 's' : ''} en esta orden
            </p>
            {orderPromos.map(p => (
              <p key={p.id} className="text-xs text-emerald-600">
                {p.name} —{' '}
                {p.type === 'percentage' ? `${p.value}% de descuento` : `$${p.value} de descuento`}
              </p>
            ))}
          </div>
        </div>
      )}

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
          const cartItem  = getCartItem(product.id)
          const promo     = getProductPromo(product.id)
          const discPrice = promo ? getDiscountedPrice(product, promo) : null

          return (
            <div key={product.id}
              className={clsx(
                'border rounded-xl p-3 transition-colors',
                promo
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-gray-100 hover:border-gray-200'
              )}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {product.name}
                  </p>

                  {/* Precio con o sin promo */}
                  {promo ? (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 line-through">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">
                        ${Number(discPrice).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  )}

                  {/* Badge de promo */}
                  {promo && (
                    <div className="flex items-center gap-1 mt-1">
                      <Tag size={10} className="text-emerald-600" />
                      <span className="text-xs text-emerald-700 font-medium">
                        {promo.name} —{' '}
                        {promo.type === 'percentage'
                          ? `${promo.value}% off`
                          : `-$${promo.value}`}
                      </span>
                    </div>
                  )}
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
                      <span className="w-6 text-center text-sm font-semibold text-gray-800">
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
