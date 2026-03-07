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

// CSS optimizado para papel térmico 80mm
// Área imprimible real: ~72mm. Fuente monospace para alineación perfecta.
const PRINT_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    margin: 0;
    size: 80mm auto;
  }

  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    line-height: 1.4;
    width: 72mm;
    padding: 4mm 2mm;
    color: #000;
  }

  .center    { text-align: center; }
  .right     { text-align: right; }
  .bold      { font-weight: bold; }
  .large     { font-size: 14px; }
  .small     { font-size: 9px; }
  .mt        { margin-top: 4px; }
  .mb        { margin-bottom: 4px; }

  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 5px 0;
  }

  .divider-solid {
    border: none;
    border-top: 1px solid #000;
    margin: 5px 0;
  }

  /* Fila de dos columnas flex-like con espaciado */
  .row {
    display: flex;
    justify-content: space-between;
    margin: 1px 0;
  }

  .row .label  { flex: 1; }
  .row .value  { flex-shrink: 0; margin-left: 4px; text-align: right; }

  /* Item de producto — nombre puede ser largo */
  .item-name {
    flex: 1;
    word-break: break-word;
  }

  .item-qty {
    flex-shrink: 0;
    width: 18px;
    margin-right: 4px;
  }

  .item-price {
    flex-shrink: 0;
    margin-left: 4px;
    text-align: right;
    white-space: nowrap;
  }

  .total-row {
    font-size: 14px;
    font-weight: bold;
    margin-top: 3px;
  }

  .promo-row {
    color: #000;
  }

  .footer {
    margin-top: 8px;
    text-align: center;
    font-size: 9px;
  }

  /* Espacio al final para el corte automático */
  .cut-space {
    margin-top: 12mm;
  }
`

export default function TicketModal({ payment, table, items, onClose }) {
  const ticketRef = useRef(null)

  function handlePrint() {
    const content = ticketRef.current.innerHTML
    const win = window.open('', '_blank', 'width=350,height=700')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Ticket</title>
          <style>${PRINT_STYLES}</style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print()
              window.onafterprint = function() { window.close() }
            }
          <\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const subtotal = Number(payment.subtotal)
  const discount = Number(payment.discount_amount ?? 0)
  const total    = Number(payment.total)
  const received = Number(payment.received_amount ?? 0)
  const change   = Number(payment.change_amount ?? 0)

  // Nombre del negocio — puedes personalizarlo aquí
  const BUSINESS_NAME = 'Clave 878'
  const BUSINESS_SUB  = 'Sistema de Gestión Interno'
  const FOOTER_MSG    = '¡Gracias por su visita!'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* Header del modal */}
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

        {/* Preview del ticket en pantalla */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div ref={ticketRef}
            className="font-mono text-xs border border-dashed
                       border-gray-300 rounded-lg p-4 bg-gray-50">

            {/* Encabezado */}
            <div className="text-center mb-2">
              <p className="font-bold text-sm">{BUSINESS_NAME}</p>
              <p className="text-gray-500 text-xs">{BUSINESS_SUB}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <div className="text-xs text-gray-600 mb-2">
              <p>{formatDate(payment.created_at)}</p>
              <p>Mesa {table.number}{table.name ? ` · ${table.name}` : ''}</p>
              <p>Pago: {PAYMENT_METHOD_LABEL[payment.payment_method]}</p>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Productos */}
            <div className="space-y-0.5 mb-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="flex-1 truncate">
                    {item.quantity}x {item.products?.name}
                  </span>
                  <span className="ml-2 flex-shrink-0">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Totales */}
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Descuento</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm
                              pt-1 border-t border-gray-300">
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
              </div>
              {received > 0 && (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>Recibido</span>
                    <span>${received.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Cambio</span>
                    <span>${change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            <p className="text-center text-xs text-gray-500">
              {FOOTER_MSG}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-5 flex gap-3">
          <button type="button" onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5
                       border border-gray-200 text-gray-600 rounded-xl text-sm
                       hover:bg-gray-50 transition-colors font-medium">
            <Printer size={16} />
            Imprimir ticket
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl
                       text-sm hover:bg-emerald-600 transition-colors font-medium">
            Cerrar
          </button>
        </div>

        {/* Nota de configuración */}
        <p className="text-center text-xs text-gray-400 pb-4 px-6">
          Asegúrate de seleccionar la impresora térmica en el diálogo de impresión
          y desactivar encabezados/pies de página del navegador
        </p>
      </div>
    </div>
  )
}
