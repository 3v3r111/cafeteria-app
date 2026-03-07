import { useState, useEffect, useCallback } from 'react'
import { supabase, syncBus, visibilityBus } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export const DAYS = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
]

export function usePromotions() {
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPromotions = useCallback(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select(`*, products(id, name, price)`)
      .order('created_at', { ascending: false })
    if (error) { toast.error('Error cargando promociones'); return }
    setPromotions(data ?? [])
    setLoading(false)
  }, [])

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('is_available', true)
      .order('name')
    setProducts(data ?? [])
  }, [])

  useEffect(() => {
    fetchPromotions()
    fetchProducts()

    const unsubSync       = syncBus.subscribe(() => fetchPromotions())
    const unsubVisibility = visibilityBus.subscribe(() => fetchPromotions())
    const channel = supabase
      .channel('promotions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' },
        () => fetchPromotions())
      .subscribe()

    return () => { unsubSync(); supabase.removeChannel(channel) }
  }, [fetchPromotions, fetchProducts])

  async function addPromotion(data) {
    const { error } = await supabase
      .from('promotions')
      .insert(buildPayload(data))
    if (error) { toast.error('Error creando promoción'); return false }
    toast.success('Promoción creada')
    return true
  }

  async function updatePromotion(id, data) {
    const { error } = await supabase
      .from('promotions')
      .update(buildPayload(data))
      .eq('id', id)
    if (error) { toast.error('Error actualizando promoción'); return false }
    toast.success('Promoción actualizada')
    return true
  }

  async function togglePromotion(id, isActive) {
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) { toast.error('Error actualizando estado'); return false }
    toast.success(isActive ? 'Promoción activada' : 'Promoción desactivada')
    return true
  }

  async function deletePromotion(id) {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
    if (error) { toast.error('Error eliminando promoción'); return false }
    toast.success('Promoción eliminada')
    return true
  }

  function buildPayload(data) {
    return {
      name:         data.name,
      type:         data.type,
      value:        Number(data.value),
      applies_to:   data.applies_to,
      product_id:   data.applies_to === 'product' ? data.product_id : null,
      start_date:   data.start_date || null,
      end_date:     data.end_date   || null,
      days_of_week: data.days_of_week?.length ? data.days_of_week : null,
      is_active:    data.is_active ?? true,
    }
  }

  // Evalúa si una promoción está vigente ahora mismo
  function isCurrentlyActive(promo) {
    if (!promo.is_active) return false
    const now   = new Date()
    const today = now.toISOString().split('T')[0]
    const dayOfWeek = now.getDay() // 0=Dom

    if (promo.start_date && today < promo.start_date) return false
    if (promo.end_date   && today > promo.end_date)   return false
    if (promo.days_of_week?.length &&
        !promo.days_of_week.includes(dayOfWeek)) return false

    return true
  }

  // Calcula el descuento que aplica a un subtotal dado una lista de promociones activas
  function calcDiscount(subtotal, activePromos) {
    let discount = 0
    for (const promo of activePromos) {
      if (!isCurrentlyActive(promo)) continue
      if (promo.applies_to === 'order') {
        discount += promo.type === 'percentage'
          ? subtotal * (promo.value / 100)
          : Math.min(promo.value, subtotal)
      }
    }
    return Math.min(discount, subtotal)
  }

  const activeNow = promotions.filter(isCurrentlyActive)

  return {
    promotions, products, loading, activeNow,
    fetchPromotions,
    addPromotion, updatePromotion, togglePromotion, deletePromotion,
    isCurrentlyActive, calcDiscount,
  }
}