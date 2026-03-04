import { useState, useEffect, useCallback } from 'react'
import { useFinance, EXPENSE_CATEGORIES } from './useFinance'
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  Plus, Edit2, Trash2, ChevronDown, ChevronUp,
  BarChart2, FileText, Wallet, X, CheckCircle
} from 'lucide-react'
import clsx from 'clsx'

// ── Helpers ────────────────────────────────────────────────────────
const METHOD_LABEL = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
const METHOD_COLOR = { cash: 'text-blue-600', card: 'text-purple-600', transfer: 'text-amber-600' }

function fmt(n) { return `$${Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtDate(d) { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) }

function getPreset(id) {
  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  if (id === 'today') {
    return { from: today, to: today }
  }
  if (id === 'week') {
    const mon = new Date(now)
    mon.setDate(now.getDate() - now.getDay() + 1)
    return { from: mon.toISOString().split('T')[0], to: today }
  }
  if (id === 'month') {
    return { from: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, to: today }
  }
  if (id === 'last_month') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lme = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: lm.toISOString().split('T')[0], to: lme.toISOString().split('T')[0] }
  }
  return { from: today, to: today }
}

// ── Stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, sub }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={clsx('text-xl font-bold', color)}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Mini bar chart (puro CSS) ──────────────────────────────────────
function MiniBarChart({ data }) {
  if (!data?.length) return null
  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expenses)), 1)
  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex items-end gap-px">
          <div
            className="flex-1 bg-emerald-400 rounded-t opacity-80 min-h-[2px]"
            style={{ height: `${(d.income / maxVal) * 96}px` }}
            title={`Ingresos: ${fmt(d.income)}`}
          />
          <div
            className="flex-1 bg-red-400 rounded-t opacity-80 min-h-[2px]"
            style={{ height: `${(d.expenses / maxVal) * 96}px` }}
            title={`Gastos: ${fmt(d.expenses)}`}
          />
        </div>
      ))}
    </div>
  )
}

// ── Expense Form Modal ─────────────────────────────────────────────
function ExpenseModal({ expense, onSave, onClose }) {
  const isEdit = !!expense
  const [form, setForm] = useState({
    category:    expense?.category    ?? 'otro',
    subcategory: expense?.subcategory ?? '',
    description: expense?.description ?? '',
    amount:      expense?.amount      ?? '',
    date:        expense?.date        ?? new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.description.trim() || !form.amount || !form.date) return
    setSaving(true)
    const ok = await onSave(form)
    setSaving(false)
    if (ok) onClose()
  }

  const isNomina = form.category === 'nomina'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Editar gasto' : 'Registrar gasto'}
          </h3>
          <button type="button" onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Categoría */}
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => set('category', cat.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
                    'border-2 transition-colors text-left',
                    form.category === cat.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}>
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subcategoría para nómina */}
          {isNomina && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1.5">
                Nombre del empleado
              </label>
              <input value={form.subcategory}
                onChange={e => set('subcategory', e.target.value)}
                placeholder="Ej: Juan García"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          )}

          {/* Descripción */}
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Descripción
            </label>
            <input value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder={isNomina ? 'Ej: Pago quincenal' : 'Ej: Factura CFE marzo'}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">$</span>
              <input type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Fecha
            </label>
            <input type="date" value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600
                       rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave}
            disabled={saving || !form.description.trim() || !form.amount}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600
                       disabled:bg-emerald-300 text-white rounded-xl text-sm
                       transition-colors flex items-center justify-center gap-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent
                              rounded-full animate-spin" />
            ) : (
              <><CheckCircle size={14} /> {isEdit ? 'Guardar cambios' : 'Registrar'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Resumen ───────────────────────────────────────────────────
function TabResumen({ summary, dailySeries, range }) {
  const { grossIncome, cancelled, netIncome, totalExpenses,
          netProfit, margin, byCategory, byMethod } = summary

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Ingresos netos"   value={fmt(netIncome)}    icon={TrendingUp}   color="text-emerald-600" bg="bg-emerald-50"
          sub={cancelled > 0 ? `-${fmt(cancelled)} cancelado` : null} />
        <StatCard label="Total egresos"    value={fmt(totalExpenses)} icon={TrendingDown} color="text-red-500"     bg="bg-red-50" />
        <StatCard label="Utilidad neta"    value={fmt(netProfit)}     icon={DollarSign}
          color={netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}
          bg={netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} />
        <StatCard label="Margen de utilidad" value={`${margin.toFixed(1)}%`} icon={Percent}
          color={margin >= 0 ? 'text-blue-600' : 'text-red-500'} bg="bg-blue-50" />
      </div>

      {/* Gráfica + desglose */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mini chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Ingresos vs Egresos
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Ingresos
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400" /> Egresos
            </span>
          </div>
          {dailySeries.length > 0
            ? <MiniBarChart data={dailySeries} />
            : <p className="text-xs text-gray-400 py-8 text-center">Sin datos en el período</p>
          }
        </div>

        {/* Métodos de pago */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Ingresos por método de pago
          </h3>
          <div className="space-y-3">
            {byMethod.map(({ method, total }) => (
              <div key={method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={clsx('font-medium', METHOD_COLOR[method])}>
                    {METHOD_LABEL[method]}
                  </span>
                  <span className="text-gray-700">{fmt(total)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all',
                      method === 'cash' ? 'bg-blue-400'
                        : method === 'card' ? 'bg-purple-400' : 'bg-amber-400'
                    )}
                    style={{ width: `${netIncome > 0 ? (total / netIncome) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {byMethod.every(m => m.total === 0) && (
              <p className="text-xs text-gray-400 py-4 text-center">Sin ingresos en el período</p>
            )}
          </div>
        </div>
      </div>

      {/* Egresos por categoría */}
      {byCategory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Egresos por categoría
          </h3>
          <div className="space-y-2">
            {byCategory
              .sort((a, b) => b.total - a.total)
              .map(cat => (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-base w-6 flex-shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate">{cat.label}</span>
                      <span className="text-gray-600 font-medium ml-2 flex-shrink-0">
                        {fmt(cat.total)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 w-10 text-right">
                    {totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Gastos ────────────────────────────────────────────────────
function TabGastos({ expenses, loading, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [deleting, setDeleting] = useState(false)

  const filtered = filterCat === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCat)

  const catMap = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.id, c]))

  async function handleDelete() {
    setDeleting(true)
    await onDelete(deletingId)
    setDeleting(false)
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button type="button"
            onClick={() => setFilterCat('all')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              filterCat === 'all'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}>
            Todos
          </button>
          {EXPENSE_CATEGORIES.map(cat => (
            <button key={cat.id} type="button"
              onClick={() => setFilterCat(cat.id)}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                filterCat === cat.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <button type="button"
          onClick={() => { setEditingExpense(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500
                     hover:bg-emerald-600 text-white rounded-xl text-sm
                     font-medium transition-colors flex-shrink-0">
          <Plus size={15} />
          Registrar gasto
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500
                          border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Wallet size={36} className="opacity-30 mb-3" />
          <p className="text-sm">Sin gastos registrados en este período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(expense => {
            const cat = catMap[expense.category] ?? catMap['otro']
            return (
              <div key={expense.id}
                className="bg-white border border-gray-100 rounded-2xl p-4
                           flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center
                                  justify-center text-base flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {expense.description}
                      </span>
                      {expense.subcategory && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100
                                         text-blue-600 rounded-full">
                          {expense.subcategory}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{cat.label}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{fmtDate(expense.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-base font-bold text-red-500">
                    -{fmt(expense.amount)}
                  </span>
                  <button type="button"
                    onClick={() => { setEditingExpense(expense); setShowForm(true) }}
                    className="p-1.5 text-gray-300 hover:text-emerald-500
                               hover:bg-emerald-50 rounded-lg transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button type="button"
                    onClick={() => setDeletingId(expense.id)}
                    className="p-1.5 text-gray-300 hover:text-red-400
                               hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Total */}
      {filtered.length > 0 && (
        <div className="bg-gray-800 rounded-2xl px-5 py-3 flex justify-between">
          <span className="text-sm text-gray-400">Total egresos</span>
          <span className="text-base font-bold text-red-400">
            -{fmt(filtered.reduce((s, e) => s + Number(e.amount), 0))}
          </span>
        </div>
      )}

      {/* Modal formulario */}
      {showForm && (
        <ExpenseModal
          expense={editingExpense}
          onSave={editingExpense
            ? (data) => onEdit(editingExpense.id, data)
            : onAdd
          }
          onClose={() => { setShowForm(false); setEditingExpense(null) }}
        />
      )}

      {/* Modal eliminar */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                        flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl
                              flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Eliminar gasto
                </h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600
                           rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600
                           disabled:bg-red-300 text-white rounded-xl text-sm
                           transition-colors flex items-center justify-center gap-2">
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white
                                  border-t-transparent rounded-full animate-spin" />
                ) : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Reportes ──────────────────────────────────────────────────
function TabReportes({ payments, expenses, cancellations }) {
  const [expanded, setExpanded] = useState(null)

  // Agrupar pagos por día
  const byDay = {}
  payments.forEach(p => {
    const day = p.created_at.split('T')[0]
    if (!byDay[day]) byDay[day] = { payments: [], total: 0, count: 0 }
    byDay[day].payments.push(p)
    byDay[day].total += Number(p.total)
    byDay[day].count++
  })

  const days = Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))

  const totalIncome = payments.reduce((s, p) => s + Number(p.total), 0)
  const totalCancelled = cancellations.reduce((s, c) => s + Number(c.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <div className="space-y-5">
      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Ventas brutas</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Cancelaciones</p>
          <p className="text-lg font-bold text-amber-500">-{fmt(totalCancelled)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Egresos</p>
          <p className="text-lg font-bold text-red-500">-{fmt(totalExpenses)}</p>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-gray-800 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">Utilidad neta del período</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {payments.length} venta{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <p className={clsx(
          'text-2xl font-bold',
          (totalIncome - totalCancelled - totalExpenses) >= 0
            ? 'text-emerald-400' : 'text-red-400'
        )}>
          {fmt(totalIncome - totalCancelled - totalExpenses)}
        </p>
      </div>

      {/* Detalle por día */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Detalle por día
        </h3>
        {days.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Sin ventas en el período seleccionado
          </p>
        ) : (
          <div className="space-y-2">
            {days.map(([day, info]) => {
              const isOpen = expanded === day
              return (
                <div key={day}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <button type="button"
                    onClick={() => setExpanded(isOpen ? null : day)}
                    className="w-full flex items-center justify-between p-4
                               hover:bg-gray-50 transition-colors text-left">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {fmtDate(day)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {info.count} venta{info.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-emerald-600">
                        {fmt(info.total)}
                      </span>
                      {isOpen
                        ? <ChevronUp size={15} className="text-gray-400" />
                        : <ChevronDown size={15} className="text-gray-400" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 p-4 space-y-2">
                      {info.payments.map(p => (
                        <div key={p.id}
                          className="flex items-center justify-between
                                     py-1.5 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-xs text-gray-700">
                              Mesa {p.orders?.tables?.number ?? '?'}
                              {p.orders?.tables?.name
                                && ` · ${p.orders.tables.name}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(p.created_at).toLocaleTimeString('es-MX', {
                                hour: '2-digit', minute: '2-digit'
                              })} · {METHOD_LABEL[p.payment_method]}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                              {fmt(p.total)}
                            </p>
                            {p.discount_amount > 0 && (
                              <p className="text-xs text-emerald-600">
                                -{fmt(p.discount_amount)} desc.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── FinancePage ────────────────────────────────────────────────────
const PRESETS = [
  { id: 'today',      label: 'Hoy'          },
  { id: 'week',       label: 'Esta semana'  },
  { id: 'month',      label: 'Este mes'     },
  { id: 'last_month', label: 'Mes anterior' },
  { id: 'custom',     label: 'Personalizado'},
]

const TABS = [
  { id: 'summary',  label: 'Resumen',  icon: BarChart2  },
  { id: 'expenses', label: 'Gastos',   icon: Wallet     },
  { id: 'reports',  label: 'Reportes', icon: FileText   },
]

export default function FinancePage() {
  const {
    expenses, payments, cancellations, loading,
    fetchAll, addExpense, updateExpense, deleteExpense,
    getSummary, getDailySeries,
  } = useFinance()

  const [activeTab, setActiveTab]     = useState('summary')
  const [preset, setPreset]           = useState('month')
  const [customFrom, setCustomFrom]   = useState('')
  const [customTo,   setCustomTo]     = useState('')

  const getRange = useCallback(() => {
    if (preset === 'custom') {
      return { from: customFrom, to: customTo }
    }
    return getPreset(preset)
  }, [preset, customFrom, customTo])

  useEffect(() => {
    const range = getRange()
    if (range.from && range.to) fetchAll(range)
  }, [preset, customFrom, customTo, fetchAll, getRange])

  async function handleAddExpense(data) {
    const ok = await addExpense(data)
    if (ok) fetchAll(getRange())
    return ok
  }

  async function handleEditExpense(id, data) {
    const ok = await updateExpense(id, data)
    if (ok) fetchAll(getRange())
    return ok
  }

  async function handleDeleteExpense(id) {
    const ok = await deleteExpense(id)
    if (ok) fetchAll(getRange())
    return ok
  }

  const range      = getRange()
  const summary    = getSummary()
  const dailySeries = range.from && range.to
    ? getDailySeries(range.from, range.to)
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Finanzas</h1>
        <p className="text-gray-500 mt-1">Balance, gastos y reportes</p>
      </div>

      {/* Selector de período */}
      <div className="mb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.id} type="button"
              onClick={() => setPreset(p.id)}
              className={clsx(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                preset === p.id
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">De</span>
              <input type="date" value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">a</span>
              <input type="date" value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button"
            onClick={() => setActiveTab(id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm',
              'font-medium transition-all',
              activeTab === id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === 'summary' && (
        <TabResumen
          summary={summary}
          dailySeries={dailySeries}
          range={range}
        />
      )}
      {activeTab === 'expenses' && (
        <TabGastos
          expenses={expenses}
          loading={loading}
          onAdd={handleAddExpense}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />
      )}
      {activeTab === 'reports' && (
        <TabReportes
          payments={payments}
          expenses={expenses}
          cancellations={cancellations}
        />
      )}
    </div>
  )
}
