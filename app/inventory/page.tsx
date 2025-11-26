'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProductList } from '@/components/inventory/ProductList'
import { TourHelpButton } from '@/components/tour/TourHelpButton'

export default function InventoryPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6" data-tour="inventory-container">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage products, stock levels, and pricing
            </p>
          </div>

          <ProductList />
        </div>
        
        <TourHelpButton pageId="inventory" />
      </AppLayout>
    </ProtectedRoute>
  )
}
