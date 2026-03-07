import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, syncBus } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useOrders(tableId = null) {
  const [orders, setOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const fetchActiveOrder = useCallback(async (tId) => {
    if (!tId) return
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 8000)
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items (*, products (id, name, price))`)
      .eq('table_id', tId)
      .in('status', ['pending', 'preparing', 'ready', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    clearTimeout(timeout)
    setLoading(false)
    if (error) { console.error('Error fetching order:', error); return }
    setActiveOrder(data ?? null)
  }, [])

  const fetchAllActiveOrders = useCallback(async () => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables (number, name),
        order_items (*, products (id, name, price))
      `)
      .in('status', ['pending', 'preparing', 'ready', 'delivered'])
      .order('created_at', { ascending: true })
    clearTimeout(timeout)
    if (error) { console.error('Error fetching orders:', error); setLoading(false); return }
    setOrders(data ?? [])
    setLoading(false)
  }, [])

  const debouncedFetch = useCallback((fetchFn) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchFn, 300)
  }, [])

  // Suscripción para cocina (sin tableId)
  useEffect(() => {
    if (tableId) return
    fetchAllActiveOrders()
    setLoading(true)

    const unsubSync       = syncBus.subscribe(() => fetchAllActiveOrders())

    const channel = supabase
      .channel('orders_kitchen')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => debouncedFetch(fetchAllActiveOrders))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'order_items'
      }, () => debouncedFetch(fetchAllActiveOrders))
      .subscribe()

    return () => {
      unsubSync()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [tableId, fetchAllActiveOrders, debouncedFetch])

  // Suscripción para mesa específica
  useEffect(() => {
    if (!tableId) return
    fetchActiveOrder(tableId)

    const unsubSync       = syncBus.subscribe(() => fetchActiveOrder(tableId))

    const channel = supabase
      .channel(`orders_table_${tableId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => debouncedFetch(() => fetchActiveOrder(tableId)))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'order_items'
      }, () => debouncedFetch(() => fetchActiveOrder(tableId)))
      .subscribe()

    return () => {
      unsubSync()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [tableId, fetchActiveOrder, debouncedFetch])

  async function createOrder(tId, items) {
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', tId)
      .in('status', ['pending', 'preparing', 'ready', 'delivered'])
      .limit(1)

    let orderId
    if (existing && existing.length > 0) {
      orderId = existing[0].id
    } else {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ table_id: tId, status: 'pending' })
        .select()
        .single()
      if (orderError) { toast.error('Error creando orden'); return false }
      orderId = order.id
    }

    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: item.notes || null,
      status: 'pending'
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    if (itemsError) { toast.error('Error enviando items'); return false }

    await supabase
      .from('tables')
      .update({ status: 'occupied' })
      .eq('id', tId)

    toast.success('Orden enviada a cocina')
    return true
  }

  async function addItemsToOrder(orderId, items) {
    const orderItems = items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: item.notes || null,
      status: 'pending'
    }))
    const { error } = await supabase.from('order_items').insert(orderItems)
    if (error) { toast.error('Error agregando items'); return false }
    toast.success('Items agregados a la orden')
    return true
  }

  async function updateOrderItemStatus(itemId, status) {
    const { error } = await supabase
      .from('order_items').update({ status }).eq('id', itemId)
    if (error) { toast.error('Error actualizando item'); return false }
    return true
  }

  async function updateOrderStatus(orderId, status) {
    const { error } = await supabase
      .from('orders').update({ status }).eq('id', orderId)
    if (error) { toast.error('Error actualizando orden'); return false }
    return true
  }

  async function cancelOrderItem(itemId, orderId, reason) {
    const { error: cancelError } = await supabase
      .from('cancellations')
      .insert({ order_item_id: itemId, order_id: orderId, reason })
    if (cancelError) { toast.error('Error registrando cancelación'); return false }

    const { error } = await supabase
      .from('order_items').delete().eq('id', itemId)
    if (error) { toast.error('Error cancelando item'); return false }
    toast.success('Item cancelado')
    return true
  }

  async function clearPaidOrders() {
    const ordersToCheck = orders.filter(o =>
      o.order_items?.every(i => i.status === 'ready' || i.status === 'delivered')
    )
    for (const order of ordersToCheck) {
      await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)
    }
    await fetchAllActiveOrders()
  }

  return {
    orders, activeOrder, loading,
    createOrder, addItemsToOrder, updateOrderItemStatus,
    updateOrderStatus, cancelOrderItem, fetchActiveOrder,
    fetchAllActiveOrders, clearPaidOrders
  }
}