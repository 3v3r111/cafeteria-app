import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, syncBus } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function usePayments() {
  const [occupiedTables, setOccupiedTables] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchOccupiedTables = useCallback(async () => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    const { data, error } = await supabase
      .from('tables')
      .select(`
        *,
        orders (
          id, status, created_at,
          order_items (
            id, quantity, unit_price, notes, status,
            products (id, name)
          )
        )
      `)
      .eq('is_active', true)
      .eq('status', 'occupied')
      .in('orders.status', ['pending', 'preparing', 'ready', 'delivered'])
      .order('number', { ascending: true })

    clearTimeout(timeout)
    if (error) { toast.error('Error cargando mesas'); setLoading(false); return }

    const tablesWithOrders = (data ?? []).filter(t =>
      t.orders && t.orders.length > 0
    )
    setOccupiedTables(tablesWithOrders)
    setLoading(false)
  }, [])

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchOccupiedTables, 300)
  }, [fetchOccupiedTables])

  useEffect(() => {
    fetchOccupiedTables()

    const unsubSync = syncBus.subscribe(() => fetchOccupiedTables())

    const channel = supabase
      .channel('payments_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'tables'
      }, () => debouncedFetch())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => debouncedFetch())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'order_items'
      }, () => debouncedFetch())
      .subscribe()

    return () => {
      unsubSync()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchOccupiedTables, debouncedFetch])

  // ── Pago atómico via RPC ───────────────────────────────────────────
  // Ejecuta insertar pago + cerrar orden + liberar mesa en una sola
  // transacción SQL. Si cualquier paso falla, PostgreSQL hace rollback
  // automático — nunca queda la BD en estado inconsistente.
  async function processPayment({ tableId, orderId, subtotal,
    discount, total, paymentMethod, cashReceived, change }) {

    const { data, error } = await supabase.rpc('process_payment', {
      p_order_id: orderId,
      p_table_id: tableId,
      p_subtotal: subtotal,
      p_discount: discount ?? 0,
      p_total:    total,
      p_method:   paymentMethod,
      p_received: cashReceived ?? null,
      p_change:   change ?? 0,
    })

    if (error) {
      console.error('Error en process_payment RPC:', error)
      toast.error('Error registrando pago — intenta de nuevo')
      return null
    }

    toast.success('Pago registrado correctamente')
    // La función RPC devuelve el registro de payment como JSON
    return typeof data === 'string' ? JSON.parse(data) : data
  }

  async function getRecentPayments(limit = 20) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          tables (number, name),
          order_items (quantity, unit_price, products (name))
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) { toast.error('Error cargando pagos'); return [] }
    return data ?? []
  }

  return {
    occupiedTables, loading,
    processPayment, getRecentPayments, fetchOccupiedTables
  }
}
