import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, syncBus } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useInventory() {
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchItems = useCallback(async () => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    clearTimeout(timeout)
    if (error) { toast.error('Error cargando inventario'); setLoading(false); return }
    setItems(data ?? [])
    setLoading(false)
  }, [])

  const fetchMovements = useCallback(async (itemId = null, limit = 20) => {
    let query = supabase
      .from('inventory_movements')
      .select(`*, inventory_items(name, unit)`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (itemId) query = query.eq('item_id', itemId)

    const { data, error } = await query
    if (error) { toast.error('Error cargando movimientos'); return }
    setMovements(data ?? [])
  }, [])

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchItems(), 300)
  }, [fetchItems])

  useEffect(() => {
    fetchItems()
    fetchMovements()

    const unsubSync = syncBus.subscribe(() => {
      fetchItems()
      fetchMovements()
    })

    const channel = supabase
      .channel('inventory_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inventory_items'
      }, () => debouncedFetch())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'inventory_movements'
      }, () => {
        fetchItems()
        fetchMovements()
      })
      .subscribe()

    return () => {
      unsubSync()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchItems, fetchMovements, debouncedFetch])

  const lowStockItems = items.filter(i =>
    Number(i.current_stock) <= Number(i.min_stock)
  )

  async function addItem(data) {
    const { error } = await supabase
      .from('inventory_items')
      .insert({
        name: data.name,
        unit: data.unit,
        current_stock: Number(data.current_stock) || 0,
        min_stock: Number(data.min_stock) || 0,
        cost_per_unit: Number(data.cost_per_unit) || 0,
        is_active: true
      })
    if (error) { toast.error('Error creando insumo'); return false }
    toast.success('Insumo creado')
    return true
  }

  async function updateItem(id, data) {
    const { error } = await supabase
      .from('inventory_items')
      .update({
        name: data.name,
        unit: data.unit,
        min_stock: Number(data.min_stock) || 0,
        cost_per_unit: Number(data.cost_per_unit) || 0,
      })
      .eq('id', id)
    if (error) { toast.error('Error actualizando insumo'); return false }
    toast.success('Insumo actualizado')
    return true
  }

  async function deleteItem(id) {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id)
    if (error) { toast.error('Error eliminando insumo'); return false }
    toast.success('Insumo eliminado')
    return true
  }

  async function addStock({ itemId, quantity, unitCost, notes }) {
    const item = items.find(i => i.id === itemId)
    if (!item) return false

    const totalCost = Number(quantity) * Number(unitCost || item.cost_per_unit)
    const newStock = Number(item.current_stock) + Number(quantity)

    // 1. Registrar movimiento (sin user_id — no existe esa columna)
    const { error: movError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id: itemId,
        type: 'in',
        quantity: Number(quantity),
        unit_cost: Number(unitCost || item.cost_per_unit),
        total_cost: totalCost,
        notes: notes || null
      })
    if (movError) {
      console.error('movError:', movError)
      toast.error('Error registrando movimiento')
      return false
    }

    // 2. Actualizar stock
    const { error: stockError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', itemId)
    if (stockError) {
      console.error('stockError:', stockError)
      toast.error('Error actualizando stock')
      return false
    }

    // 3. Registrar como egreso si tiene costo
    if (totalCost > 0) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('expenses')
        .insert({
          category: 'inventario',
          description: `Compra: ${item.name} (${quantity} ${item.unit})`,
          amount: totalCost,
          date: new Date().toISOString().split('T')[0],
          user_id: user?.id
        })
    }

    toast.success(`+${quantity} ${item.unit} de ${item.name}`)
    return true
  }

  async function removeStock({ itemId, quantity, notes }) {
    const item = items.find(i => i.id === itemId)
    if (!item) return false

    if (Number(quantity) > Number(item.current_stock)) {
      toast.error('No hay suficiente stock')
      return false
    }

    const newStock = Number(item.current_stock) - Number(quantity)

    // Sin user_id — no existe esa columna en inventory_movements
    const { error: movError } = await supabase
      .from('inventory_movements')
      .insert({
        item_id: itemId,
        type: 'out',
        quantity: Number(quantity),
        unit_cost: Number(item.cost_per_unit),
        total_cost: Number(quantity) * Number(item.cost_per_unit),
        notes: notes || null
      })
    if (movError) {
      console.error('movError:', movError)
      toast.error('Error registrando movimiento')
      return false
    }

    const { error: stockError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', itemId)
    if (stockError) {
      console.error('stockError:', stockError)
      toast.error('Error actualizando stock')
      return false
    }

    toast.success(`-${quantity} ${item.unit} de ${item.name}`)
    return true
  }

  return {
    items, movements, loading, lowStockItems,
    fetchItems, fetchMovements,
    addItem, updateItem, deleteItem,
    addStock, removeStock
  }
}