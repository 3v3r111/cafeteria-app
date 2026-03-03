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
            // ... resto igual

        return () => {
            unsubSync()
            if (debounceRef.current) clearTimeout(debounceRef.current)
            supabase.removeChannel(channel)
        }
    }, [fetchOccupiedTables, debouncedFetch])

    async function processPayment({ tableId, orderId, items, subtotal,
        discount, total, paymentMethod, notes, cashReceived, change }) {

        // 1. Registrar el pago con el esquema correcto
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
            order_id: orderId,
            subtotal,
            discount_amount: discount,
            total,
            payment_method: paymentMethod,
            received_amount: cashReceived ?? null,
            change_amount: change ?? 0,
            })
            .select()
            .single()

        if (paymentError) { 
            console.error('Payment error:', paymentError)
            toast.error('Error registrando pago')
            return null 
        }

        // 2. Cerrar la orden
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)

        if (orderError) { toast.error('Error cerrando orden'); return null }

        // 3. Liberar la mesa
        const { error: tableError } = await supabase
            .from('tables')
            .update({ status: 'free' })
            .eq('id', tableId)

        if (tableError) { toast.error('Error liberando mesa'); return null }

        toast.success('Pago registrado correctamente')
        return payment
    }

  async function getRecentPayments(limit = 20) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        orders (
          id,
          tables (number, name),
          order_items (
            quantity, unit_price,
            products (name)
          )
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) { toast.error('Error cargando pagos'); return [] }
    return data ?? []
  }

  return {
    occupiedTables,
    loading,
    processPayment,
    getRecentPayments,
    fetchOccupiedTables
  }
}