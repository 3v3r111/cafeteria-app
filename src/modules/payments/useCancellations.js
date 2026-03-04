import { useState, useCallback } from 'react'
import { supabase } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useCancellations() {
  const [cancellations, setCancellations] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCancellations = useCallback(async (filters = {}) => {
    setLoading(true)
    const timeout = setTimeout(() => setLoading(false), 8000)

    let query = supabase
      .from('cancellations')
      .select(`
            *,
            order_items (
            quantity, unit_price,
            products (name)
            ),
            orders (
            tables (number, name)
            )
        `)
      .order('created_at', { ascending: false })

    if (filters.date) {
      const start = new Date(filters.date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filters.date)
      end.setHours(23, 59, 59, 999)
      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
    }

    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query
    clearTimeout(timeout)
    setLoading(false)

    if (error) { toast.error('Error cargando cancelaciones'); return }
    setCancellations(data ?? [])
  }, [])

  return { cancellations, loading, fetchCancellations }
}