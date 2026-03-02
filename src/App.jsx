import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Auth
import { AuthProvider } from './modules/auth/AuthContext'
import ProtectedRoute from './shared/components/ProtectedRoute'
import LoginPage from './modules/auth/LoginPage'

// Páginas
import SalonPage from './modules/salon/SalonPage'
import KitchenPage from './modules/kitchen/KitchenPage'
import MenuPage from './modules/menu/MenuPage'
import PaymentsPage from './modules/payments/PaymentsPage'
import InventoryPage from './modules/inventory/InventoryPage'
import FinancePage from './modules/finance/FinancePage'
import PromotionsPage from './modules/promotions/PromotionsPage'

// Shared
import NotFoundPage from './shared/components/NotFoundPage'
import UnauthorizedPage from './shared/components/UnauthorizedPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/no-autorizado" element={<UnauthorizedPage />} />

        {/* Redirigir raíz al salón */}
        <Route path="/" element={<Navigate to="/salon" replace />} />

        {/* Rutas protegidas — Mesero y Admin */}
        <Route path="/salon" element={
          <ProtectedRoute allowedRoles={['admin', 'waiter']}>
            <SalonPage />
          </ProtectedRoute>
        } />

        <Route path="/pagos" element={
          <ProtectedRoute allowedRoles={['admin', 'waiter']}>
            <PaymentsPage />
          </ProtectedRoute>
        } />

        {/* Rutas protegidas — Cocina y Admin */}
        <Route path="/cocina" element={
          <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
            <KitchenPage />
          </ProtectedRoute>
        } />

        {/* Rutas protegidas — Solo Admin */}
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MenuPage />
          </ProtectedRoute>
        } />

        <Route path="/inventario" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <InventoryPage />
          </ProtectedRoute>
        } />

        <Route path="/finanzas" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <FinancePage />
          </ProtectedRoute>
        } />

        <Route path="/promociones" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PromotionsPage />
          </ProtectedRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}