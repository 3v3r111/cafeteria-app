import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function TableFormModal({ table, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', capacity: 4 })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (table) {
      setForm({
        name: table.name || '',
        capacity: table.capacity || 4
      })
    }
  }, [table])

  function validate() {
    const e = {}
    if (form.capacity < 1 || form.capacity > 20)
      e.capacity = 'La capacidad debe ser entre 1 y 20'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    const ok = await onSave({
      name: form.name.trim() || null,
      capacity: Number(form.capacity)
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {table ? `Editar Mesa ${table.number}` : 'Nueva Mesa'}
          </h2>
          <button type="button" onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 
                       hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre o alias
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder='Ej. "Terraza", "VIP"'
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad de personas
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.capacity}
              onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-400
                         ${errors.capacity ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.capacity &&
              <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
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