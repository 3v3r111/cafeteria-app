import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, syncBus } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useTables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchTables = useCallback(async () => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('number', { ascending: true })
    clearTimeout(timeout)
    if (error) { toast.error('Error cargando mesas'); setLoading(false); return }
    setTables(data)
    setLoading(false)
  }, [])

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchTables(), 300)
  }, [fetchTables])

  useEffect(() => {
    fetchTables()

    const unsubSync       = syncBus.subscribe(() => fetchTables())

    const channel = supabase
      .channel('tables_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tables'
      }, () => debouncedFetch())
      .subscribe()

    return () => {
      unsubSync()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchTables, debouncedFetch])

  async function renumberTables(tablesData) {
    for (let i = 0; i < tablesData.length; i++) {
      await supabase
        .from('tables')
        .update({ number: i + 1 })
        .eq('id', tablesData[i].id)
    }
  }

  async function addTable(tableData) {
    const maxNumber = tables.length > 0
      ? Math.max(...tables.map(t => t.number))
      : 0
    const { error } = await supabase
      .from('tables')
      .insert({ ...tableData, number: maxNumber + 1, status: 'free' })
    if (error) { toast.error('Error creando mesa'); return false }
    toast.success('Mesa creada')
    return true
  }

  async function updateTable(id, tableData) {
    const { error } = await supabase
      .from('tables')
      .update(tableData)
      .eq('id', id)
    if (error) { toast.error('Error actualizando mesa'); return false }
    toast.success('Mesa actualizada')
    return true
  }

  async function deleteTable(id) {
    const table = tables.find(t => t.id === id)
    if (table?.status !== 'free') {
      toast.error('Solo puedes eliminar mesas que estén libres')
      return false
    }
    const { error } = await supabase
      .from('tables')
      .update({ is_active: false })
      .eq('id', id)
    if (error) { toast.error('Error eliminando mesa'); return false }

    const remaining = tables
      .filter(t => t.id !== id)
      .sort((a, b) => a.number - b.number)
    await renumberTables(remaining)

    toast.success('Mesa eliminada')
    return true
  }

  async function updateTableStatus(id, status) {
    const { error } = await supabase
      .from('tables')
      .update({ status })
      .eq('id', id)
    if (error) { toast.error('Error actualizando estado'); return false }
    return true
  }

  return {
    tables, loading, fetchTables,
    addTable, updateTable, deleteTable, updateTableStatus
  }
}