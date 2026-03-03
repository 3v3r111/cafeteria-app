import { useRef } from 'react'
import { X, Printer, CheckCircle } from 'lucide-react'

const PAYMENT_METHOD_LABEL = {
  cash:     'Efectivo',
  card:     'Tarjeta',
  transfer: 'Transferencia'
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function TicketModal({ payment, table, items, onClose }) {
  const ticketRef = useRef(null)

  function handlePrint() {
    const content = ticketRef.current.innerHTML
    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(`
      <html>
        <head>
          <title>Ticket</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: monospace; font-size: 12px; padding: 16px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    win.print()
    win.close()
  }

  const subtotal = payment.subtotal
  const discount = payment.discount_amount
  const total = payment.total

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Pago completado
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Ticket para imprimir */}
        <div className="px-6 py-4">
          <div ref={ticketRef} className="font-mono text-xs">
            <div className="text-center mb-3">
              <p className="font-bold text-base">CAFETERÍA</p>
              <p>Sistema de Gestión Interno</p>
              <p className="mt-1">{formatDate(payment.created_at)}</p>
              <p>Mesa {table.number}{table.name ? ` · ${table.name}` : ''}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            <div className="space-y-1 mb-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="flex-1 truncate">
                    x{item.quantity} {item.products?.name}
                  </span>
                  <span className="ml-2 flex-shrink-0">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${Number(subtotal).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-${Number(discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm mt-1">
                <span>TOTAL</span>
                <span>${Number(total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Método de pago</span>
                <span>{PAYMENT_METHOD_LABEL[payment.payment_method]}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-2" />
            <p className="text-center text-gray-500">¡Gracias por su visita!</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5
                       border border-gray-200 text-gray-600 rounded-xl text-sm
                       hover:bg-gray-50 transition-colors"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl
                       text-sm hover:bg-emerald-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}