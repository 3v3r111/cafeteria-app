import { useState, useEffect } from 'react'
import { supabase } from '../../shared/lib/supabase'
import toast from 'react-hot-toast'

export function useMenu() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchProducts()])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      toast.error('Error cargando categorías')
      return
    }
    setCategories(data)
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('name', { ascending: true })

    if (error) {
      toast.error('Error cargando productos')
      return
    }
    setProducts(data)
  }

  // --- Categorías ---
  async function addCategory(name) {
    const display_order = categories.length
    const { error } = await supabase
      .from('categories')
      .insert({ name, display_order })

    if (error) { toast.error('Error creando categoría'); return false }
    toast.success('Categoría creada')
    await fetchCategories()
    return true
  }

  async function updateCategory(id, name) {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)

    if (error) { toast.error('Error actualizando categoría'); return false }
    toast.success('Categoría actualizada')
    await fetchCategories()
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
    await fetchCategories()
    return true
  }

  // --- Productos ---
  async function addProduct(productData) {
    const { error } = await supabase
      .from('products')
      .insert(productData)

    if (error) { toast.error('Error creando producto'); return false }
    toast.success('Producto creado')
    await fetchProducts()
    return true
  }

  async function updateProduct(id, productData) {
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)

    if (error) { toast.error('Error actualizando producto'); return false }
    toast.success('Producto actualizado')
    await fetchProducts()
    return true
  }

  async function deleteProduct(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) { toast.error('Error eliminando producto'); return false }
    toast.success('Producto eliminado')
    await fetchProducts()
    return true
  }

  async function toggleProductAvailability(id, currentValue) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentValue })
      .eq('id', id)

    if (error) { toast.error('Error actualizando disponibilidad'); return false }
    await fetchProducts()
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