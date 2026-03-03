import { useState } from 'react'
import { useTables } from './useTables'
import { useAuth } from '../../modules/auth/useAuth'
import TableMap from './components/TableMap'
import TableFormModal from './components/TableFormModal'
import OrderPanel from './components/OrderPanel'

export default function SalonPage() {
  const { isAdmin } = useAuth()
  const { tables, loading, addTable, updateTable, deleteTable, updateTableStatus } = useTables()

  const [showForm, setShowForm] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)

  function handleAdd() { setEditingTable(null); setShowForm(true) }
  function handleEdit(table) { setEditingTable(table); setShowForm(true) }

  async function handleSave(data) {
    if (editingTable) return await updateTable(editingTable.id, data)
    return await addTable(data)
  }

  function handleSelectTable(table) {
    setSelectedTable(table)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salón y Mesas</h1>
        <p className="text-gray-500 mt-1">
          {tables.length} mesa{tables.length !== 1 ? 's' : ''} registrada{tables.length !== 1 ? 's' : ''}
        </p>
      </div>

      <TableMap
        tables={tables}
        isAdmin={isAdmin}
        onSelectTable={handleSelectTable}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={deleteTable}
        onStatusChange={updateTableStatus}
      />

      {showForm && (
        <TableFormModal
          table={editingTable}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTable(null) }}
        />
      )}

      {selectedTable && (
        <OrderPanel
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  )
}