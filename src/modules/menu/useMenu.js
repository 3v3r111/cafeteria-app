import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useMenu() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef(null)

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) { toast.error('Error cargando categorías'); return }
    setCategories(data)
  }, [])

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name', { ascending: true })

    if (error) { toast.error('Error cargando productos'); return }
    setProducts(data)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchProducts()])
    setLoading(false)
  }, [fetchCategories, fetchProducts])

  const debouncedFetch = useCallback((fetchFn) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fetchFn, 300)
  }, [])

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('menu_realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'products'
      }, () => debouncedFetch(fetchProducts))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'categories'
      }, () => debouncedFetch(fetchAll))
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [fetchAll, fetchProducts, debouncedFetch])

  // --- Categorías ---
  async function addCategory(name) {
    const display_order = categories.length
    const { error } = await supabase
      .from('categories')
      .insert({ name, display_order })

    if (error) { toast.error('Error creando categoría'); return false }
    toast.success('Categoría creada')
    return true
  }

  async function updateCategory(id, name) {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)

    if (error) { toast.error('Error actualizando categoría'); return false }
    toast.success('Categoría actualizada')
    return true
  }

  async function deleteCategory(id) {
    const hasProducts = products.some(p => p.category_id === id)
    if (hasProducts) {
      toast.error('No puedes eliminar una categoría con productos')
      return false
    }
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) { toast.error('Error eliminando categoría'); return false }
    toast.success('Categoría eliminada')
    return true
  }

  // --- Productos ---
  async function addProduct(productData) {
    const { error } = await supabase
      .from('products')
      .insert(productData)

    if (error) { toast.error('Error creando producto'); return false }
    toast.success('Producto creado')
    return true
  }

  async function updateProduct(id, productData) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)

    if (error) { toast.error('Error actualizando producto'); return false }
    toast.success('Producto actualizado')
    return true
  }

  async function deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) { toast.error('Error eliminando producto'); return false }
    toast.success('Producto eliminado')
    return true
  }

  async function toggleProductAvailability(id, currentValue) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentValue })
      .eq('id', id)

    if (error) { toast.error('Error actualizando disponibilidad'); return false }
    return true
  }

  return {
    categories,
    products,
    loading,
    fetchAll,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability
  }
}