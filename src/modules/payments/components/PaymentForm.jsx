import { useState, useEffect } from 'react'
import { CreditCard, Banknote, ArrowLeftRight, Tag } from 'lucide-react'
import clsx from 'clsx'

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Efectivo',      icon: Banknote       },
  { id: 'card',     label: 'Tarjeta',       icon: CreditCard     },
  { id: 'transfer', label: 'Transferencia', icon: ArrowLeftRight },
]

export default function PaymentForm({
  subtotal,
  autoDiscount = 0,      // descuento calculado automáticamente por promociones
  promoDetails  = [],    // [{ name, amount }] — detalle de cada promo
  onConfirm,
  processing
}) {
  const [method,        setMethod]        = useState('cash')
  const [discountType,  setDiscountType]  = useState('none')
  const [discountValue, setDiscountValue] = useState('')
  const [notes,         setNotes]         = useState('')
  const [cashReceived,  setCashReceived]  = useState('')

  // Resetear descuento manual al cambiar subtotal
  useEffect(() => {
    setDiscountValue('')
    setDiscountType('none')
  }, [subtotal])

  // Descuento manual adicional
  const manualDiscount = (() => {
    if (discountType === 'none' || !discountValue) return 0
    const val = Number(discountValue)
    const base = subtotal - autoDiscount
    if (discountType === 'percent') return Math.min((base * val) / 100, base)
    if (discountType === 'fixed')   return Math.min(val, base)
    return 0
  })()

  const totalDiscount = autoDiscount + manualDiscount
  const total         = Math.max(subtotal - totalDiscount, 0)

  const change = method === 'cash' && cashReceived
    ? Math.max(Number(cashReceived) - total, 0)
    : null

  const cashInsufficient = method === 'cash' && cashReceived &&
    Number(cashReceived) < total

  function handleSubmit() {
    if (cashInsufficient) return
    onConfirm({
      method,
      discount: totalDiscount,
      total,
      notes,
      cashReceived: method === 'cash' && cashReceived ? Number(cashReceived) : null,
      change:       method === 'cash' && change ? change : 0
    })
  }

  return (
    <div className="space-y-5">

      {/* Método de pago */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Método de pago</p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setMethod(id)}
              className={clsx(
                'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl',
                'border-2 text-xs font-medium transition-all',
                method === id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Efectivo recibido */}
      {method === 'cash' && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Efectivo recibido
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm">$</span>
            <input type="number" min={total} step="0.01"
              value={cashReceived}
              onChange={e => setCashReceived(e.target.value)}
              placeholder={total.toFixed(2)}
              className={clsx(
                'w-full pl-7 pr-3 py-2.5 border rounded-xl text-sm',
                'focus:outline-none focus:ring-2 focus:ring-emerald-400',
                cashInsufficient ? 'border-red-400' : 'border-gray-200'
              )}
            />
          </div>
          {cashInsufficient && (
            <p className="text-red-500 text-xs mt-1">
              El efectivo recibido es menor al total
            </p>
          )}
          {change !== null && change > 0 && (
            <div className="mt-2 px-3 py-2 bg-emerald-50 rounded-xl
                            flex justify-between items-center">
              <span className="text-sm text-emerald-700">Cambio</span>
              <span className="text-base font-bold text-emerald-700">
                ${change.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Promociones aplicadas automáticamente */}
      {promoDetails.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Tag size={13} className="text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-700">
              Promociones aplicadas
            </p>
          </div>
          {promoDetails.map((p, i) => (
            <div key={i} className="flex justify-between text-xs text-emerald-700">
              <span>{p.name}</span>
              <span className="font-medium">-${p.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs font-bold text-emerald-800
                          pt-1 border-t border-emerald-200">
            <span>Total descuento promos</span>
            <span>-${autoDiscount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Descuento manual adicional */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Descuento adicional
          {promoDetails.length > 0 && (
            <span className="text-gray-400 font-normal ml-1">(además de la promo)</span>
          )}
        </p>
        <div className="flex gap-2 mb-2">
          {[
            { id: 'none',    label: 'Sin descuento' },
            { id: 'percent', label: 'Porcentaje %'  },
            { id: 'fixed',   label: 'Monto fijo $'  },
          ].map(opt => (
            <button key={opt.id} type="button"
              onClick={() => { setDiscountType(opt.id); setDiscountValue('') }}
              className={clsx(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                discountType === opt.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}>
              {opt.label}
            </button>
          ))}
        </div>
        {discountType !== 'none' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400 text-sm">
              {discountType === 'percent' ? '%' : '$'}
            </span>
            <input type="number" min="0"
              max={discountType === 'percent' ? 100 : subtotal - autoDiscount}
              step="0.01" value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Notas
          <span className="text-gray-400 font-normal ml-1">(opcional)</span>
        </p>
        <input type="text" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Ej: cortesía, evento especial..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Resumen de cobro */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {promoDetails.map((p, i) => (
          <div key={i} className="flex justify-between text-sm text-emerald-600">
            <span className="flex items-center gap-1">
              <Tag size={11} /> {p.name}
            </span>
            <span>-${p.amount.toFixed(2)}</span>
          </div>
        ))}
        {manualDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600">
            <span>Descuento adicional</span>
            <span>-${manualDiscount.toFixed(2)}</span>
          </div>
        )}
        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm font-medium text-emerald-700
                          pt-1 border-t border-gray-200">
            <span>Total descuentos</span>
            <span>-${totalDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-800
                        pt-2 border-t border-gray-200">
          <span>Total a cobrar</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Botón confirmar */}
      <button type="button" onClick={handleSubmit}
        disabled={processing || cashInsufficient}
        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600
                   disabled:bg-emerald-300 text-white font-bold rounded-2xl
                   transition-colors flex items-center justify-center gap-2 text-base">
        {processing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent
                          rounded-full animate-spin" />
        ) : (
          `Confirmar pago · $${total.toFixed(2)}`
        )}
      </button>
    </div>
  )
}
