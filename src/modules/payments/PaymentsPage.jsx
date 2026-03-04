import { useState } from 'react'
import { useAuth } from '../../modules/auth/useAuth'
import { usePayments } from './usePayments'
import TableSelector from './components/TableSelector'
import OrderSummary from './components/OrderSummary'
import PaymentForm from './components/PaymentForm'
import TicketModal from './components/TicketModal'
import CancellationsLog from './components/CancellationsLog'
import CashRegisterPanel from './components/CashRegisterPanel'
import { Receipt, AlertTriangle, Calculator } from 'lucide-react'
import clsx from 'clsx'

const ALL_TABS = [
  { id: 'payments',      label: 'Cobro',          icon: Receipt,       roles: ['admin', 'waiter'] },
  { id: 'cancellations', label: 'Cancelaciones',   icon: AlertTriangle, roles: ['admin']           },
  { id: 'cash',          label: 'Corte de Caja',   icon: Calculator,    roles: ['admin', 'waiter'] },
]

export default function PaymentsPage() {
  const { profile, isAdmin } = useAuth()
  const { occupiedTables, loading, processPayment } = usePayments()

  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(profile?.role))

  const [activeTab, setActiveTab] = useState('payments')
  const [selectedTable, setSelectedTable] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [completedPayment, setCompletedPayment] = useState(null)

  const allItems = selectedTable?.orders?.flatMap(o => o.order_items ?? []) ?? []
  const subtotal = allItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0)
  const activeOrderId = selectedTable?.orders?.[0]?.id

  async function handleConfirmPayment({ method, discount, total, notes, cashReceived, change }) {
    if (!selectedTable || !activeOrderId) return
    setProcessing(true)
    const payment = await processPayment({
      tableId: selectedTable.id,
      orderId: activeOrderId,
      items: allItems,
      subtotal,
      discount,
      total,
      paymentMethod: method,
      notes,
      cashReceived,
      change
    })
    setProcessing(false)
    if (payment) setCompletedPayment(payment)
  }

  function handleTicketClose() {
    setCompletedPayment(null)
    setSelectedTable(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pagos y Caja</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Cobro */}
      {activeTab === 'payments' && (
        <>
          <p className="text-gray-500 text-sm mb-4">
            {occupiedTables.length} mesa{occupiedTables.length !== 1 ? 's' : ''} con cuenta pendiente
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent
                              rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">
                    Mesas con cuenta abierta
                  </h2>
                  <TableSelector
                    tables={occupiedTables}
                    selectedTable={selectedTable}
                    onSelect={setSelectedTable}
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                {!selectedTable ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100
                                  flex flex-col items-center justify-center h-64">
                    <Receipt size={40} className="text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Selecciona una mesa</p>
                    <p className="text-gray-400 text-sm mt-1">
                      para ver el detalle y procesar el cobro
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100
                                    p-5 flex flex-col">
                      <h2 className="text-base font-semibold text-gray-800 mb-1">
                        Mesa {selectedTable.number}
                        {selectedTable.name &&
                          <span className="text-gray-400 font-normal ml-1">
                            · {selectedTable.name}
                          </span>
                        }
                      </h2>
                      <p className="text-xs text-gray-400 mb-4">
                        {allItems.length} producto{allItems.length !== 1 ? 's' : ''}
                      </p>
                      <OrderSummary table={selectedTable} />
                      <div className="mt-4 pt-3 border-t border-gray-100
                                      flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Subtotal</span>
                        <span className="text-base font-bold text-gray-800">
                          ${subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h2 className="text-base font-semibold text-gray-800 mb-4">
                        Procesar cobro
                      </h2>
                      <PaymentForm
                        subtotal={subtotal}
                        onConfirm={handleConfirmPayment}
                        processing={processing}
                      />
                      {/* Cancelar cobro — solo admin */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setSelectedTable(null)}
                          className="w-full mt-3 py-2.5 border border-red-200 text-red-500
                                     hover:bg-red-50 rounded-xl text-sm transition-colors"
                        >
                          Cancelar cobro
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'cancellations' && <CancellationsLog />}
      {activeTab === 'cash' && <CashRegisterPanel />}

      {completedPayment && selectedTable && (
        <TicketModal
          payment={completedPayment}
          table={selectedTable}
          items={allItems}
          onClose={handleTicketClose}
        />
      )}
    </div>
  )
}