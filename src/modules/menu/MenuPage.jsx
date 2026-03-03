import { useState } from 'react'
import { useMenu } from './useMenu'
import CategoryManager from './components/CategoryManager'
import ProductList from './components/ProductList'
import ProductForm from './components/ProductForm'

export default function MenuPage() {
  const {
    categories, products, loading,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    toggleProductAvailability
  } = useMenu()

  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  function handleAdd() {
    setEditingProduct(null)
    setShowForm(true)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  async function handleSave(data) {
    if (editingProduct) {
      return await updateProduct(editingProduct.id, data)
    }
    return await addProduct(data)
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Menú</h1>
        <p className="text-gray-500 mt-1">
          Administra las categorías y productos del menú
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryManager
            categories={categories}
            onAdd={addCategory}
            onUpdate={updateCategory}
            onDelete={deleteCategory}
          />
        </div>
        <div className="lg:col-span-2">
          <ProductList
            products={products}
            categories={categories}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={deleteProduct}
            onToggleAvailability={toggleProductAvailability}
          />
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null) }}
        />
      )}
    </div>
  )
}