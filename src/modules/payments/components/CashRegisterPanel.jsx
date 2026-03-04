import { useEffect, useState } from 'react'
import { useCashRegister } from '../useCashRegister'
import { Calculator, TrendingUp, Banknote, CreditCard,
         ArrowLeftRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function CashRegisterPanel() {
  const { registers, loading, todaySummary,
          fetchTodaySummary, fetchRegisters, saveCashRegister, closeDay } = useCashRegister()

  const [openingBalance, setOpeningBalance] = useState('')
  const [physicalCash, setPhysicalCash] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCloseDay, setShowCloseDay] = useState(false)
  const [closingDay, setClosingDay] = useState(false)

  useEffect(() => {
    fetchTodaySummary()
    fetchRegisters()
  }, [fetchTodaySummary, fetchRegisters])

  // Efectivo esperado = fondo + ventas efectivo - cancelaciones en efectivo
  const expectedCash = (Number(openingBalance) || 0) +
    (todaySummary?.cashSales ?? 0) -
    (todaySummary?.totalCancelled ?? 0)

  const difference = physicalCash !== ''
    ? Number(physicalCash) - expectedCash
    : null

  async function handleSave() {
    if (!physicalCash) return
    setSaving(true)
    const ok = await saveCashRegister({
      openingBalance: Number(openingBalance) || 0,
      closingBalance: Number(physicalCash),
      expectedBalance: expectedCash,
      difference: difference ?? 0,
      notes
    })
    setSaving(false)
    if (ok) { setSaved(true); setPhysicalCash(''); setNotes('') }
  }

  async function handleCloseDay() {
    setClosingDay(true)
    await closeDay()
    setClosingDay(false)
    setShowCloseDay(false)
    await fetchTodaySummary()
  }

  return (
    <div className="space-y-6">

      {/* Resumen del día */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Resumen del día</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ventas brutas',  value: todaySummary?.totalSales ?? 0,
              icon: TrendingUp,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Efectivo',       value: todaySummary?.cashSales ?? 0,
              icon: Banknote,      color: 'text-blue-600',    bg: 'bg-blue-50'    },
            { label: 'Tarjeta',        value: todaySummary?.cardSales ?? 0,
              icon: CreditCard,    color: 'text-purple-600',  bg: 'bg-purple-50'  },
            { label: 'Transferencia',  value: todaySummary?.transferSales ?? 0,
              icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-50'   },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label}
              className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', bg)}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={clsx('text-lg font-bold mt-0.5', color)}>
                ${Number(value).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Cancelaciones del día */}
        {(todaySummary?.totalCancelled ?? 0) > 0 && (
          <div className="mt-3 bg-red-50 border border-red-100 rounded-2xl p-4
                          flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              <div>
                <p className="text-sm font-medium text-red-700">
                  Cancelaciones del día
                </p>
                <p className="text-xs text-red-500">
                  {todaySummary.cancellationCount} cancelación{todaySummary.cancellationCount !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-red-600">
              -${(todaySummary.totalCancelled ?? 0).toFixed(2)}
            </p>
          </div>
        )}

        {/* Neto real */}
        <div className="mt-3 bg-gray-800 rounded-2xl p-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Venta neta del día</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {todaySummary?.transactionCount ?? 0} transacciones
            </p>
          </div>
          <p className="text-2xl font-bold text-white">
            ${(todaySummary?.netSales ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Formulario arqueo */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4
                       flex items-center gap-2">
          <Calculator size={18} className="text-emerald-500" />
          Corte de caja
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Fondo inicial de caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">$</span>
              <input type="number" min="0" step="0.01"
                value={openingBalance}
                onChange={e => { setOpeningBalance(e.target.value); setSaved(false) }}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Efectivo físico contado
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">$</span>
              <input type="number" min="0" step="0.01"
                value={physicalCash}
                onChange={e => { setPhysicalCash(e.target.value); setSaved(false) }}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {physicalCash !== '' && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Fondo inicial</span>
                <span>${(Number(openingBalance) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Ventas efectivo</span>
                <span className="text-emerald-600">
                  +${(todaySummary?.cashSales ?? 0).toFixed(2)}
                </span>
              </div>
              {(todaySummary?.totalCancelled ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Cancelaciones</span>
                  <span className="text-red-500">
                    -${(todaySummary?.totalCancelled ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium text-gray-700
                              pt-2 border-t border-gray-200">
                <span>Efectivo esperado</span>
                <span>${expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-700">
                <span>Efectivo contado</span>
                <span>${Number(physicalCash).toFixed(2)}</span>
              </div>
              <div className={clsx(
                'flex justify-between text-base font-bold pt-2 border-t border-gray-200',
                difference === 0 ? 'text-emerald-600'
                  : difference > 0 ? 'text-blue-600' : 'text-red-500'
              )}>
                <span>
                  {difference === 0 ? '✓ Cuadra'
                    : difference > 0 ? 'Sobrante' : 'Faltante'}
                </span>
                <span>{difference >= 0 ? '+' : ''}${difference?.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Notas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej: se retiró efectivo para banco..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <button type="button" onClick={handleSave}
            disabled={saving || !physicalCash || saved}
            className={clsx(
              'w-full py-3 font-semibold rounded-2xl transition-colors',
              'flex items-center justify-center gap-2',
              saved ? 'bg-emerald-100 text-emerald-700'
                : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white'
            )}>
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle size={18} /> Corte guardado</>
            ) : (
              <><Calculator size={18} /> Guardar corte de caja</>
            )}
          </button>
        </div>
      </div>

      {/* Botón Finalizar día */}
      <button type="button" onClick={() => setShowCloseDay(true)}
        className="w-full py-3 border-2 border-red-200 text-red-500
                   hover:bg-red-50 rounded-2xl font-semibold text-sm
                   transition-colors flex items-center justify-center gap-2">
        <AlertTriangle size={16} />
        Finalizar día
      </button>

      {/* Historial */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3
                       flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          Historial de cortes
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : registers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin cortes registrados</p>
        ) : (
          <div className="space-y-3">
            {registers.map(r => {
              const diff = Number(r.difference)
              return (
                <div key={r.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {r.notes === 'Cierre de día'
                          ? '🔒 Cierre de día'
                          : `Corte — ${formatDate(r.closed_at)}`
                        }
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                        {r.notes !== 'Cierre de día' && (
                          <>
                            <span>Esperado: ${Number(r.expected_balance).toFixed(2)}</span>
                            <span>Contado: ${Number(r.closing_balance).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      {r.notes && r.notes !== 'Cierre de día' && (
                        <p className="text-xs text-gray-400 mt-1">📝 {r.notes}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(r.closed_at)}
                      </p>
                    </div>
                    {r.notes !== 'Cierre de día' && (
                      <div className={clsx(
                        'text-sm font-bold flex-shrink-0',
                        diff === 0 ? 'text-emerald-600'
                          : diff > 0 ? 'text-blue-600' : 'text-red-500'
                      )}>
                        {diff >= 0 ? '+' : ''}${diff.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Finalizar día */}
      {showCloseDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                        flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Finalizar día</h3>
                <p className="text-xs text-gray-500">Esta acción registrará el cierre del día</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              El resumen del día quedará registrado en el historial.
              Los datos históricos de ventas y cancelaciones no se eliminarán.
            </p>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => setShowCloseDay(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600
                           rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button type="button"
                onClick={handleCloseDay}
                disabled={closingDay}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600
                           disabled:bg-red-300 text-white rounded-xl text-sm
                           transition-colors flex items-center justify-center gap-2"
              >
                {closingDay ? (
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full animate-spin" />
                ) : 'Sí, finalizar día'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}