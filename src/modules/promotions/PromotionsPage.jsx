import { useState } from 'react'
import { usePromotions, DAYS } from './usePromotions'
import { Plus, Edit2, Trash2, Tag, ToggleLeft, ToggleRight,
         Calendar, Clock, X, CheckCircle, Percent, DollarSign } from 'lucide-react'
import clsx from 'clsx'

// ── Helpers ────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function PromoValue({ type, value }) {
  return (
    <span className="flex items-center gap-0.5 font-bold text-emerald-600">
      {type === 'percentage'
        ? <><span className="text-lg">{value}</span><Percent size={13} /></>
        : <><DollarSign size={13} /><span className="text-lg">{value}</span></>
      }
    </span>
  )
}

function StatusBadge({ promo, isActive }) {
  if (!promo.is_active) {
    return (
      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500
                       rounded-full font-medium">
        Inactiva
      </span>
    )
  }
  if (isActive) {
    return (
      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700
                       rounded-full font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        Activa ahora
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600
                     rounded-full font-medium">
      Programada
    </span>
  )
}

// ── Promotion Form Modal ───────────────────────────────────────────
const EMPTY_FORM = {
  name: '', type: 'percentage', value: '', applies_to: 'order',
  product_id: '', start_date: '', end_date: '', days_of_week: [], is_active: true,
}

function PromoModal({ promo, products, onSave, onClose }) {
  const isEdit = !!promo
  const [form, setForm] = useState(isEdit ? {
    name:         promo.name,
    type:         promo.type,
    value:        String(promo.value),
    applies_to:   promo.applies_to,
    product_id:   promo.product_id ?? '',
    start_date:   promo.start_date ?? '',
    end_date:     promo.end_date   ?? '',
    days_of_week: promo.days_of_week ?? [],
    is_active:    promo.is_active,
  } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleDay(dayId) {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(dayId)
        ? f.days_of_week.filter(d => d !== dayId)
        : [...f.days_of_week, dayId]
    }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.value) return
    if (form.applies_to === 'product' && !form.product_id) return
    setSaving(true)
    const ok = await onSave(form)
    setSaving(false)
    if (ok) onClose()
  }

  const previewDiscount = form.value
    ? form.type === 'percentage'
      ? `${form.value}% de descuento`
      : `$${form.value} de descuento`
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50
                    flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            {isEdit ? 'Editar promoción' : 'Nueva promoción'}
          </h3>
          <button type="button" onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 rounded-xl transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Nombre */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              Nombre de la promoción
            </label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Ej: Jueves de café 2x1, Descuento fin de semana..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Tipo de descuento */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              Tipo de descuento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'percentage', label: 'Porcentaje', icon: Percent,
                  desc: 'Ej: 10% de descuento' },
                { id: 'fixed',      label: 'Monto fijo', icon: DollarSign,
                  desc: 'Ej: $20 de descuento' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <button key={id} type="button" onClick={() => set('type', id)}
                  className={clsx(
                    'flex flex-col items-start p-3 rounded-xl border-2 transition-colors text-left',
                    form.type === id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={form.type === id
                      ? 'text-emerald-600' : 'text-gray-500'} />
                    <span className={clsx('text-sm font-medium',
                      form.type === id ? 'text-emerald-700' : 'text-gray-700')}>
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">
              {form.type === 'percentage' ? 'Porcentaje (%)' : 'Monto fijo ($)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2
                               text-gray-400 text-sm">
                {form.type === 'percentage' ? '%' : '$'}
              </span>
              <input type="number" min="0.01"
                max={form.type === 'percentage' ? 100 : undefined}
                step="0.01" value={form.value}
                onChange={e => set('value', e.target.value)}
                placeholder={form.type === 'percentage' ? '10' : '20.00'}
                className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl
                           text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            {previewDiscount && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                ✓ {previewDiscount}
              </p>
            )}
          </div>

          {/* Aplica a */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              ¿A qué aplica?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'order',   label: 'Toda la orden',
                  desc: 'Descuento sobre el total' },
                { id: 'product', label: 'Producto específico',
                  desc: 'Solo a un producto' },
              ].map(({ id, label, desc }) => (
                <button key={id} type="button" onClick={() => set('applies_to', id)}
                  className={clsx(
                    'flex flex-col items-start p-3 rounded-xl border-2 transition-colors text-left',
                    form.applies_to === id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                  <span className={clsx('text-sm font-medium mb-0.5',
                    form.applies_to === id ? 'text-emerald-700' : 'text-gray-700')}>
                    {label}
                  </span>
                  <span className="text-xs text-gray-400">{desc}</span>
                </button>
              ))}
            </div>

            {/* Selector de producto */}
            {form.applies_to === 'product' && (
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">
                  Producto
                </label>
                <select value={form.product_id}
                  onChange={e => set('product_id', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${Number(p.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Vigencia por fechas */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              <Calendar size={12} className="inline mr-1" />
              Vigencia por fechas
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Desde</label>
                <input type="date" value={form.start_date}
                  onChange={e => set('start_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Hasta</label>
                <input type="date" value={form.end_date}
                  onChange={e => set('end_date', e.target.value)}
                  min={form.start_date || undefined}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl
                             text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
          </div>

          {/* Días de la semana */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-2">
              <Clock size={12} className="inline mr-1" />
              Días de la semana
              <span className="text-gray-400 font-normal ml-1">(opcional — todos si no se selecciona)</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(day => (
                <button key={day.id} type="button"
                  onClick={() => toggleDay(day.id)}
                  className={clsx(
                    'w-12 py-2 rounded-xl text-xs font-medium transition-colors border-2',
                    form.days_of_week.includes(day.id)
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}>
                  {day.label}
                </button>
              ))}
            </div>
            {form.days_of_week.length > 0 && (
              <p className="text-xs text-emerald-600 mt-1.5">
                Aplica: {form.days_of_week
                  .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                  .map(d => DAYS.find(x => x.id === d)?.label)
                  .join(', ')}
              </p>
            )}
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between py-3 px-4
                          bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-700">Estado inicial</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.is_active ? 'La promoción estará activa al guardar' : 'Se guardará como inactiva'}
              </p>
            </div>
            <button type="button" onClick={() => set('is_active', !form.is_active)}>
              {form.is_active
                ? <ToggleRight size={32} className="text-emerald-500" />
                : <ToggleLeft  size={32} className="text-gray-300"    />
              }
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600
                       rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.value ||
              (form.applies_to === 'product' && !form.product_id)}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600
                       disabled:bg-emerald-300 text-white rounded-xl text-sm
                       transition-colors flex items-center justify-center gap-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full animate-spin" />
            ) : (
              <><CheckCircle size={14} /> {isEdit ? 'Guardar cambios' : 'Crear promoción'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Promo Card ─────────────────────────────────────────────────────
function PromoCard({ promo, isActive, onEdit, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const daysLabel = promo.days_of_week?.length
    ? promo.days_of_week
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map(d => DAYS.find(x => x.id === d)?.label)
        .join(', ')
    : 'Todos los días'

  return (
    <div className={clsx(
      'bg-white rounded-2xl border-2 p-4 transition-colors',
      isActive ? 'border-emerald-200' : 'border-gray-100'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {promo.name}
            </h3>
            <StatusBadge promo={promo} isActive={isActive} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {promo.applies_to === 'order'
              ? 'Aplica a toda la orden'
              : `Producto: ${promo.products?.name ?? '—'}`
            }
          </p>
        </div>
        <PromoValue type={promo.type} value={promo.value} />
      </div>

      {/* Vigencia */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={11} className="flex-shrink-0" />
          <span>{daysLabel}</span>
        </div>
        {(promo.start_date || promo.end_date) && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={11} className="flex-shrink-0" />
            <span>
              {promo.start_date ? fmtDate(promo.start_date) : '—'}
              {' → '}
              {promo.end_date ? fmtDate(promo.end_date) : 'Sin límite'}
            </span>
          </div>
        )}
      </div>

      {/* Acciones */}
      {confirmDelete ? (
        <div className="space-y-2">
          <p className="text-xs text-red-600 font-medium">¿Eliminar esta promoción?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 text-xs border border-gray-200 text-gray-600
                         rounded-lg hover:bg-gray-50 transition-colors">
              No
            </button>
            <button type="button" onClick={() => onDelete(promo.id)}
              className="flex-1 py-1.5 text-xs bg-red-500 hover:bg-red-600
                         text-white rounded-lg transition-colors">
              Sí, eliminar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onToggle(promo.id, !promo.is_active)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs',
              'font-medium transition-colors flex-1 justify-center',
              promo.is_active
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            )}>
            {promo.is_active
              ? <><ToggleLeft size={13} /> Desactivar</>
              : <><ToggleRight size={13} /> Activar</>
            }
          </button>
          <button type="button" onClick={() => onEdit(promo)}
            className="p-2 text-gray-300 hover:text-emerald-500
                       hover:bg-emerald-50 rounded-xl transition-colors">
            <Edit2 size={14} />
          </button>
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="p-2 text-gray-300 hover:text-red-400
                       hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── PromotionsPage ─────────────────────────────────────────────────
export default function PromotionsPage() {
  const {
    promotions, products, loading, activeNow,
    addPromotion, updatePromotion, togglePromotion, deletePromotion,
    isCurrentlyActive,
  } = usePromotions()

  const [showModal, setShowModal]   = useState(false)
  const [editingPromo, setEditing]  = useState(null)
  const [filter, setFilter]         = useState('all') // all | active | inactive

  function openEdit(promo) { setEditing(promo); setShowModal(true) }
  function openNew()        { setEditing(null);  setShowModal(true) }

  async function handleSave(data) {
    return editingPromo
      ? updatePromotion(editingPromo.id, data)
      : addPromotion(data)
  }

  const filtered = promotions.filter(p => {
    if (filter === 'active')   return p.is_active
    if (filter === 'inactive') return !p.is_active
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500
                        border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promociones</h1>
          <p className="text-gray-500 mt-1">
            {promotions.length} promoción{promotions.length !== 1 ? 'es' : ''} ·{' '}
            <span className="text-emerald-600 font-medium">
              {activeNow.length} activa{activeNow.length !== 1 ? 's' : ''} ahora
            </span>
          </p>
        </div>
        <button type="button" onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500
                     hover:bg-emerald-600 text-white rounded-xl text-sm
                     font-medium transition-colors">
          <Plus size={16} />
          Nueva promoción
        </button>
      </div>

      {/* Banner promociones activas */}
      {activeNow.length > 0 && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200
                        rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm font-semibold text-emerald-800">
              Promociones activas en este momento
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeNow.map(p => (
              <span key={p.id}
                className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700
                           rounded-full font-medium">
                {p.name} —{' '}
                {p.type === 'percentage' ? `${p.value}%` : `$${p.value}`}
                {p.applies_to === 'product' && p.products?.name
                  ? ` en ${p.products.name}` : ' en orden'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'all',      label: `Todas (${promotions.length})`         },
          { id: 'active',   label: `Activas (${promotions.filter(p => p.is_active).length})`   },
          { id: 'inactive', label: `Inactivas (${promotions.filter(p => !p.is_active).length})` },
        ].map(f => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Tag size={40} className="opacity-30 mb-3" />
          <p className="text-sm">
            {filter === 'all'
              ? 'Sin promociones creadas'
              : `Sin promociones ${filter === 'active' ? 'activas' : 'inactivas'}`}
          </p>
          {filter === 'all' && (
            <button type="button" onClick={openNew}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700
                         font-medium underline underline-offset-2">
              Crear primera promoción
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              isActive={isCurrentlyActive(promo)}
              onEdit={openEdit}
              onToggle={togglePromotion}
              onDelete={deletePromotion}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PromoModal
          promo={editingPromo}
          products={products}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
