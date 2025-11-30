'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DebtSummaryCards, DebtAgingBreakdown } from '@/components/debts/DebtSummaryCards'
import { DebtList } from '@/components/debts/DebtList'
import { CustomerDebtView } from '@/components/debts/CustomerDebtView'
import { DebtDetailSheet } from '@/components/debts/DebtDetailSheet'
import { DebtTransaction } from '@/types'

export default function DebtsPage() {
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null)

  const handleSelectDebt = (debt: DebtTransaction) => {
    setSelectedDebtId(debt.id)
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Debt Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage customer debts and payments
            </p>
          </div>

          <DebtSummaryCards />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="transactions">By Transaction</TabsTrigger>
                  <TabsTrigger value="customers">By Customer</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transactions">
                  <DebtList onSelectDebt={handleSelectDebt} />
                </TabsContent>
                
                <TabsContent value="customers">
                  <CustomerDebtView onSelectDebt={handleSelectDebt} />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <DebtAgingBreakdown />
            </div>
          </div>
        </div>

        {selectedDebtId && (
          <DebtDetailSheet
            debtId={selectedDebtId}
            onClose={() => setSelectedDebtId(null)}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}
