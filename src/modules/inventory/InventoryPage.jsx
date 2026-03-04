import { useState } from 'react'
import { useInventory } from './useInventory'
import { Package, AlertTriangle, Plus, TrendingUp,
         TrendingDown, Edit2, Trash2, History } from 'lucide-react'
import clsx from 'clsx'

const UNITS = ['kg', 'g', 'L', 'ml', 'pz', 'caja', 'bolsa', 'lata', 'sobre']

function ItemForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name:          item?.name          ?? '',
    unit:          item?.unit          ?? 'pz',
    current_stock: item?.current_stock ?? '',
    min_stock:     item?.min_stock     ?? '',
    cost_per_unit: item?.cost_per_unit ?? '',
  })

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">
          {item ? 'Editar insumo' : 'Nuevo insumo'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Nombre
            </label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="Ej: Café molido"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Unidad
            </label>
            <select name="unit" value={form.unit} onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Costo por unidad
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">$</span>
              <input name="cost_per_unit" type="number" min="0" step="0.01"
                value={form.cost_per_unit} onChange={handleChange}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          </div>

          {!item && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Stock inicial
              </label>
              <input name="current_stock" type="number" min="0" step="0.01"
                value={form.current_stock} onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Stock mínimo (alerta)
            </label>
            <input name="min_stock" type="number" min="0" step="0.01"
              value={form.min_stock} onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                         text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600
                       rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => onSave(form)}
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600
                       disabled:bg-emerald-300 text-white rounded-xl text-sm
                       transition-colors">
            {item ? 'Guardar cambios' : 'Crear insumo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StockModal({ item, type, onSave, onClose }) {
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState(item?.cost_per_unit ?? '')
  const [notes, setNotes] = useState('')
  const isIn = type === 'in'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isIn ? 'bg-emerald-100' : 'bg-red-100'
          )}>
            {isIn
              ? <TrendingUp size={20} className="text-emerald-600" />
              : <TrendingDown size={20} className="text-red-500" />
            }
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {isIn ? 'Entrada de stock' : 'Salida de stock'}
            </h3>
            <p className="text-xs text-gray-500">{item?.name}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-500">Stock actual</span>
          <span className="font-semibold text-gray-800">
            {item?.current_stock} {item?.unit}
          </span>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Cantidad ({item?.unit})
          </label>
          <input type="number" min="0.01" step="0.01"
            value={quantity} onChange={e => setQuantity(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        {isIn && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Costo por unidad
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">$</span>
              <input type="number" min="0" step="0.01"
                value={unitCost} onChange={e => setUnitCost(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            {quantity && unitCost && (
              <p className="text-xs text-emerald-600 mt-1.5">
                Total egreso: ${(Number(quantity) * Number(unitCost)).toFixed(2)}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder={isIn ? 'Ej: compra semanal' : 'Ej: merma, uso del día'}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                       text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600
                       rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button"
            onClick={() => onSave({ quantity, unitCost, notes })}
            disabled={!quantity || Number(quantity) <= 0}
            className={clsx(
              'flex-1 py-2.5 text-white rounded-xl text-sm transition-colors',
              'disabled:opacity-50',
              isIn
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-red-500 hover:bg-red-600'
            )}>
            {isIn ? 'Registrar entrada' : 'Registrar salida'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MovementsModal({ item, movements, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                      max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4
                        border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Historial — {item.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock actual: {item.current_stock} {item.unit}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 rounded-xl transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {movements.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              Sin movimientos registrados
            </p>
          ) : (
            movements.map(m => (
              <div key={m.id}
                className="flex items-center justify-between p-3
                           border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    m.type === 'purchase' ? 'bg-emerald-100' : 'bg-red-100'
                  )}>
                    {m.type === 'purchase'
                      ? <TrendingUp size={13} className="text-emerald-600" />
                      : <TrendingDown size={13} className="text-red-500" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {m.type === 'purchase' ? '+' : '-'}{m.quantity} {item.unit}
                    </p>
                    {m.notes && (
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">
                        {m.notes}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(m.created_at).toLocaleString('es-MX', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {m.total_cost > 0 && (
                  <span className={clsx(
                    'text-sm font-medium',
                    m.type === 'purchase' ? 'text-emerald-600' : 'text-red-500'
                  )}>
                    {m.type === 'purchase' ? '-' : ''}${Number(m.total_cost).toFixed(2)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { items, movements, loading, lowStockItems,
          fetchMovements, addItem, updateItem, deleteItem,
          addStock, removeStock } = useInventory()

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [stockModal, setStockModal] = useState(null) // { item, type }
  const [historyItem, setHistoryItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterLow, setFilterLow] = useState(false)

  const filtered = items
    .filter(i => !filterLow || Number(i.current_stock) <= Number(i.min_stock))
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  async function handleSaveItem(data) {
    let ok
    if (editingItem) {
      ok = await updateItem(editingItem.id, data)
    } else {
      ok = await addItem(data)
    }
    if (ok) { setShowForm(false); setEditingItem(null) }
  }

  async function handleStockSave({ quantity, unitCost, notes }) {
    const { item, type } = stockModal
    let ok
    if (type === 'in') {
      ok = await addStock({ itemId: item.id, quantity, unitCost, notes })
    } else {
      ok = await removeStock({ itemId: item.id, quantity, notes })
    }
    if (ok) setStockModal(null)
  }

  async function handleShowHistory(item) {
    setHistoryItem(item)
    await fetchMovements(item.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent
                        rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500 mt-1">
            {items.length} insumo{items.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <button type="button"
          onClick={() => { setEditingItem(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500
                     hover:bg-emerald-600 text-white rounded-xl text-sm
                     font-medium transition-colors">
          <Plus size={16} />
          Nuevo insumo
        </button>
      </div>

      {/* Alerta stock bajo */}
      {lowStockItems.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4
                        flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lowStockItems.length} insumo{lowStockItems.length !== 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {lowStockItems.map(i => i.name).join(', ')}
            </p>
          </div>
          <button type="button"
            onClick={() => setFilterLow(f => !f)}
            className={clsx(
              'ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors flex-shrink-0',
              filterLow
                ? 'bg-amber-200 text-amber-800'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            )}>
            {filterLow ? 'Ver todos' : 'Ver solo críticos'}
          </button>
        </div>
      )}

      {/* Buscador */}
      <div className="mb-4">
        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar insumo..."
          className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-xl
                     text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package size={40} className="opacity-30 mb-3" />
          <p>Sin insumos registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const isLow = Number(item.current_stock) <= Number(item.min_stock)
            const stockPercent = item.min_stock > 0
              ? Math.min((Number(item.current_stock) / (Number(item.min_stock) * 3)) * 100, 100)
              : 100

            return (
              <div key={item.id}
                className={clsx(
                  'bg-white rounded-2xl border-2 p-4 transition-colors',
                  isLow ? 'border-amber-200' : 'border-gray-100'
                )}>

                {/* Nombre y alerta */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      {isLow && (
                        <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ${Number(item.cost_per_unit).toFixed(2)} / {item.unit}
                    </p>
                  </div>
                  {/* Acciones */}
                  <div className="flex items-center gap-1 ml-2">
                    <button type="button"
                      onClick={() => handleShowHistory(item)}
                      className="p-1.5 text-gray-300 hover:text-blue-500
                                 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Historial">
                      <History size={14} />
                    </button>
                    <button type="button"
                      onClick={() => { setEditingItem(item); setShowForm(true) }}
                      className="p-1.5 text-gray-300 hover:text-emerald-500
                                 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400
                                 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Stock */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={clsx(
                      'font-semibold text-base',
                      isLow ? 'text-amber-600' : 'text-gray-800'
                    )}>
                      {Number(item.current_stock)} {item.unit}
                    </span>
                    <span className="text-gray-400">
                      mín: {item.min_stock} {item.unit}
                    </span>
                  </div>
                  {/* Barra de stock */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        isLow ? 'bg-amber-400' : 'bg-emerald-500'
                      )}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>

                {/* Botones entrada/salida */}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setStockModal({ item, type: 'in' })}
                    className="flex items-center justify-center gap-1.5 py-2
                               bg-emerald-50 hover:bg-emerald-100 text-emerald-700
                               rounded-xl text-xs font-medium transition-colors">
                    <TrendingUp size={13} />
                    Entrada
                  </button>
                  <button type="button"
                    onClick={() => setStockModal({ item, type: 'out' })}
                    className="flex items-center justify-center gap-1.5 py-2
                               bg-red-50 hover:bg-red-100 text-red-600
                               rounded-xl text-xs font-medium transition-colors">
                    <TrendingDown size={13} />
                    Salida
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {showForm && (
        <ItemForm
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => { setShowForm(false); setEditingItem(null) }}
        />
      )}

      {stockModal && (
        <StockModal
          item={stockModal.item}
          type={stockModal.type}
          onSave={handleStockSave}
          onClose={() => setStockModal(null)}
        />
      )}

      {historyItem && (
        <MovementsModal
          item={historyItem}
          movements={movements}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </div>
  )
}