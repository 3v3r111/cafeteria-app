import { Plus } from 'lucide-react'
import TableCard from './TableCard'

export default function TableMap({ tables, isAdmin, onSelectTable, onAdd, onEdit, onDelete, onStatusChange }) {

  const free     = tables.filter(t => t.status === 'free').length
  const occupied = tables.filter(t => t.status === 'occupied').length
  const waiting  = tables.filter(t => t.status === 'waiting').length

  return (
    <div>
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{free}</p>
          <p className="text-xs text-emerald-700 mt-1">Libres</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{occupied}</p>
          <p className="text-xs text-red-700 mt-1">Ocupadas</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{waiting}</p>
          <p className="text-xs text-amber-700 mt-1">En espera</p>
        </div>
      </div>

      {/* Grid de mesas */}
      <div className="group grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 
                      lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            isAdmin={isAdmin}
            onSelect={onSelectTable}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}

        {/* Botón agregar mesa — solo admin */}
        {isAdmin && (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-2xl border-2 border-dashed border-gray-300 p-4
                       flex flex-col items-center justify-center gap-2
                       text-gray-400 hover:border-emerald-400 hover:text-emerald-500
                       hover:bg-emerald-50 transition-all duration-200 min-h-32
                       cursor-pointer"
          >
            <Plus size={24} />
            <span className="text-xs font-medium">Nueva mesa</span>
          </button>
        )}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No hay mesas registradas</p>
          <p className="text-sm mt-1">
            {isAdmin ? 'Crea tu primera mesa con el botón "+"' : 'Contacta al administrador'}
          </p>
        </div>
      )}
    </div>
  )
}