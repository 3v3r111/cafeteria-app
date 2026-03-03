import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Auth
import { AuthProvider } from './modules/auth/AuthContext'
import ProtectedRoute from './shared/components/ProtectedRoute'
import LoginPage from './modules/auth/LoginPage'

// Layout
import Layout from './shared/components/Layout'

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

function ProtectedLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>
        {children}
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/no-autorizado" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/salon" replace />} />

        {/* Mesero y Admin */}
        <Route path="/salon" element={
          <ProtectedLayout allowedRoles={['admin', 'waiter']}>
            <SalonPage />
          </ProtectedLayout>
        } />

        <Route path="/pagos" element={
          <ProtectedLayout allowedRoles={['admin', 'waiter']}>
            <PaymentsPage />
          </ProtectedLayout>
        } />

        {/* Cocina y Admin */}
        <Route path="/cocina" element={
          <ProtectedLayout allowedRoles={['admin', 'kitchen']}>
            <KitchenPage />
          </ProtectedLayout>
        } />

        {/* Solo Admin */}
        <Route path="/menu" element={
          <ProtectedLayout allowedRoles={['admin']}>
            <MenuPage />
          </ProtectedLayout>
        } />

        <Route path="/inventario" element={
          <ProtectedLayout allowedRoles={['admin']}>
            <InventoryPage />
          </ProtectedLayout>
        } />

        <Route path="/finanzas" element={
          <ProtectedLayout allowedRoles={['admin']}>
            <FinancePage />
          </ProtectedLayout>
        } />

        <Route path="/promociones" element={
          <ProtectedLayout allowedRoles={['admin']}>
            <PromotionsPage />
          </ProtectedLayout>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}