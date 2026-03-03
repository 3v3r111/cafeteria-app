import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import clsx from 'clsx'

export default function ProductList({
  products, categories, onAdd, onEdit, onDelete, onToggleAvailability
}) {
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.category_id === filterCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Productos
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({products.length})
          </span>
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 
                     text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors"
        >
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 
                                       text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl 
                       text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm 
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="all">Todas</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">No hay productos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <div key={product.id}
              className="flex items-center justify-between px-4 py-3
                         border border-gray-100 rounded-xl group hover:border-gray-200
                         transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Toggle disponibilidad */}
                <button
                  onClick={() => onToggleAvailability(product.id, product.is_available)}
                  className={clsx(
                    'w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors',
                    product.is_available ? 'bg-emerald-500' : 'bg-gray-300'
                  )}
                  title={product.is_available ? 'Disponible' : 'Agotado'}
                />
                <div className="min-w-0">
                  <p className={clsx(
                    'text-sm font-medium truncate',
                    product.is_available ? 'text-gray-800' : 'text-gray-400 line-through'
                  )}>
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {product.categories?.name ?? 'Sin categoría'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-700">
                  ${Number(product.price).toFixed(2)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 
                                transition-opacity">
                  <button onClick={() => onEdit(product)}
                    className="p-1.5 text-gray-400 hover:text-emerald-600 
                               hover:bg-emerald-50 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(product.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 
                               hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}