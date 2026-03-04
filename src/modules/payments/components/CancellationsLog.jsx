import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import { AlertTriangle, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PAYMENT_METHOD_LABEL = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia'
}

function formatDate(d) {
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function CancellationsLog() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancelling, setCancelling] = useState(null) // { type: 'item'|'full', itemId?, paymentId, amount }
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          tables (number, name),
          order_items (
            id, quantity, unit_price, status,
            products (name)
          )
        ),
        payment_cancellations (
          id, cancellation_type, amount, reason, created_at, order_item_id
        )
      `)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    setLoading(false)
    if (error) { toast.error('Error cargando cobros'); return }
    setPayments(data ?? [])
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function handleCancel() {
    if (!reason.trim()) return
    setProcessing(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (cancelling.type === 'full') {
      // Cancelar cobro completo
      const { error } = await supabase
        .from('payment_cancellations')
        .insert({
          payment_id: cancelling.paymentId,
          cancellation_type: 'full',
          amount: cancelling.amount,
          reason: reason.trim(),
          user_id: user?.id
        })
      if (error) { toast.error('Error registrando cancelación'); setProcessing(false); return }
      toast.success('Cobro cancelado')

    } else {
      // Cancelar item específico
      const { error } = await supabase
        .from('payment_cancellations')
        .insert({
          payment_id: cancelling.paymentId,
          order_item_id: cancelling.itemId,
          cancellation_type: 'item',
          amount: cancelling.amount,
          reason: reason.trim(),
          user_id: user?.id
        })
      if (error) { toast.error('Error registrando cancelación'); setProcessing(false); return }
      toast.success('Producto cancelado del cobro')
    }

    setProcessing(false)
    setCancelling(null)
    setReason('')
    await fetchPayments()
  }

  // Calcular monto ya cancelado de un pago
  function getCancelledAmount(payment) {
    return (payment.payment_cancellations ?? [])
      .reduce((sum, c) => sum + Number(c.amount), 0)
  }

  function isFullyCancelled(payment) {
    const cancelled = getCancelledAmount(payment)
    return cancelled >= Number(payment.total)
  }

  function isItemCancelled(payment, itemId) {
    return (payment.payment_cancellations ?? [])
      .some(c => c.order_item_id === itemId)
  }

  const totalCancelled = payments
    .flatMap(p => p.payment_cancellations ?? [])
    .reduce((sum, c) => sum + Number(c.amount), 0)

  const totalSales = payments.reduce((sum, p) => sum + Number(p.total), 0)
  const netSales = totalSales - totalCancelled

  return (
    <div className="space-y-5">

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cobros del día', value: totalSales, color: 'text-emerald-600' },
          { label: 'Cancelaciones',  value: -totalCancelled, color: 'text-red-500'    },
          { label: 'Neto real',      value: netSales,    color: 'text-gray-800'   },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={clsx('text-lg font-bold', color)}>
              {value < 0 ? '-' : ''}${Math.abs(value).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-base font-semibold text-gray-800">
        Cobros de hoy — selecciona uno para cancelar
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertTriangle size={36} className="opacity-30 mb-3" />
          <p>Sin cobros hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(payment => {
            const table = payment.orders?.tables
            const items = payment.orders?.order_items ?? []
            const cancelledAmt = getCancelledAmount(payment)
            const fullyCancelled = isFullyCancelled(payment)
            const isExpanded = expanded === payment.id

            return (
              <div key={payment.id}
                className={clsx(
                  'bg-white border rounded-2xl overflow-hidden transition-colors',
                  fullyCancelled ? 'border-red-200 opacity-60' : 'border-gray-100'
                )}>

                {/* Header del cobro */}
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : payment.id)}
                  className="w-full flex items-center justify-between p-4
                             hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        Mesa {table?.number ?? '?'}
                        {table?.name && ` · ${table.name}`}
                      </span>
                      {fullyCancelled && (
                        <span className="text-xs px-2 py-0.5 bg-red-100
                                         text-red-600 rounded-full font-medium">
                          Cancelado
                        </span>
                      )}
                      {cancelledAmt > 0 && !fullyCancelled && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100
                                         text-amber-600 rounded-full font-medium">
                          Cancelación parcial
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(payment.created_at)} ·{' '}
                      {PAYMENT_METHOD_LABEL[payment.payment_method]}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        ${Number(payment.total).toFixed(2)}
                      </p>
                      {cancelledAmt > 0 && (
                        <p className="text-xs text-red-500">
                          -${cancelledAmt.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </button>

                {/* Detalle expandido */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3">

                    {/* Items */}
                    <div className="space-y-2">
                      {items.map(item => {
                        const itemCancelled = isItemCancelled(payment, item.id)
                        return (
                          <div key={item.id}
                            className={clsx(
                              'flex items-center justify-between p-2.5 rounded-xl',
                              itemCancelled ? 'bg-red-50 opacity-60' : 'bg-gray-50'
                            )}>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-700">
                                x{item.quantity} {item.products?.name}
                              </span>
                              {itemCancelled && (
                                <span className="ml-2 text-xs text-red-500">
                                  (cancelado)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-sm text-gray-600">
                                ${(item.unit_price * item.quantity).toFixed(2)}
                              </span>
                              {/* Botón cancelar item */}
                              {!itemCancelled && !fullyCancelled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelling({
                                      type: 'item',
                                      paymentId: payment.id,
                                      itemId: item.id,
                                      amount: item.unit_price * item.quantity
                                    })
                                    setReason('')
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-400
                                             hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancelar este producto"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Botón cancelar cobro completo */}
                    {!fullyCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelling({
                            type: 'full',
                            paymentId: payment.id,
                            amount: Number(payment.total) - cancelledAmt
                          })
                          setReason('')
                        }}
                        className="w-full py-2 border border-red-200 text-red-500
                                   hover:bg-red-50 rounded-xl text-sm transition-colors
                                   flex items-center justify-center gap-2"
                      >
                        <X size={14} />
                        Cancelar cobro completo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de justificación */}
      {cancelling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                        flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-800">
              {cancelling.type === 'full'
                ? 'Cancelar cobro completo'
                : 'Cancelar producto del cobro'
              }
            </h3>
            <p className="text-sm text-gray-500">
              Monto a cancelar:{' '}
              <span className="font-semibold text-red-500">
                ${Number(cancelling.amount).toFixed(2)}
              </span>
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Justificación <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: producto agregado por error, cliente no recibió el producto..."
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setCancelling(null); setReason('') }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600
                           rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                No cancelar
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={processing || !reason.trim()}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600
                           disabled:bg-red-300 text-white rounded-xl text-sm
                           transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full animate-spin" />
                ) : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}