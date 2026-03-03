import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function ProductForm({ product, categories, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category_id: product.category_id || '',
        is_available: product.is_available
      })
    }
  }, [product])

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'El nombre es obligatorio'
    if (!form.price || isNaN(form.price) || Number(form.price) < 0)
      e.price = 'Ingresa un precio válido'
    if (!form.category_id) e.category_id = 'Selecciona una categoría'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    const ok = await onSave({
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      category_id: form.category_id,
      is_available: form.is_available
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 
                        border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {product ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 
                       hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ej. Café Americano"
              className={`w-full px-3 py-2.5 border rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400
                         ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Descripción opcional..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 
                                 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2.5 border rounded-xl text-sm
                             focus:outline-none focus:ring-2 focus:ring-emerald-400
                             ${errors.price ? 'border-red-400' : 'border-gray-200'}`}
                />
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={form.category_id}
                onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400
                           bg-white ${errors.category_id ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Seleccionar...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id &&
                <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}
              className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0
                         ${form.is_available ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow
                               transition-transform duration-200
                               ${form.is_available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-600">
              {form.is_available ? 'Disponible' : 'Agotado'}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 
                         rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm
                         hover:bg-emerald-600 disabled:bg-emerald-300 transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}