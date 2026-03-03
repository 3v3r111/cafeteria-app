import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

export default function CategoryManager({ categories, onAdd, onUpdate, onDelete }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!newName.trim() || saving) return
    setSaving(true)
    const ok = await onAdd(newName.trim())
    setSaving(false)
    if (ok) {
      setNewName('')
      setIsAdding(false)
    }
  }

  async function handleUpdate() {
    if (!editingName.trim() || saving) return
    setSaving(true)
    const ok = await onUpdate(editingId, editingName.trim())
    setSaving(false)
    if (ok) {
      setEditingId(null)
      setEditingName('')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Categorías</h2>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 
                       text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
          >
            <Plus size={15} /> Nueva
          </button>
        )}
      </div>

      {/* Formulario nueva categoría */}
      {isAdding && (
        <div className="mb-3 space-y-2">
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
              if (e.key === 'Escape') { setIsAdding(false); setNewName('') }
            }}
            placeholder="Nombre de la categoría"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !newName.trim()}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm
                         hover:bg-emerald-600 disabled:bg-emerald-300 transition-colors
                         flex items-center justify-center gap-1"
            >
              <Check size={14} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setNewName('') }}
              className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm
                         hover:bg-gray-200 transition-colors flex items-center 
                         justify-center gap-1"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      <ul className="space-y-2">
        {categories.length === 0 && !isAdding && (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay categorías aún
          </p>
        )}
        {categories.map(cat => (
          <li key={cat.id}
            className="flex items-center justify-between px-3 py-2.5
                       bg-gray-50 rounded-xl group">
            {editingId === cat.id ? (
              <div className="w-full space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); handleUpdate() }
                    if (e.key === 'Escape') { setEditingId(null) }
                  }}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg 
                             text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg 
                               text-xs hover:bg-emerald-600 disabled:bg-emerald-300"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 py-1.5 bg-gray-200 text-gray-600 rounded-lg 
                               text-xs hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 
                                transition-opacity">
                  <button
                    type="button"
                    onClick={() => { setEditingId(cat.id); setEditingName(cat.name) }}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 
                               hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 
                               hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}