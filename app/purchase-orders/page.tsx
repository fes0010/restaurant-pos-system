'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { PurchaseOrderList } from '@/components/purchase-orders/PurchaseOrderList'
import { TourHelpButton } from '@/components/tour/TourHelpButton'

export default function PurchaseOrdersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6" data-tour="po-container">
          <div>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage supplier purchase orders
            </p>
          </div>

          <PurchaseOrderList />
        </div>
        
        <TourHelpButton pageId="purchase-orders" />
      </AppLayout>
    </ProtectedRoute>
  )
}
