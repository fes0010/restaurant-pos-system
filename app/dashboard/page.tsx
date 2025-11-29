'use client'

import { useState, useMemo } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardKPIs } from '@/hooks/useDashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart'
import { LowStockTable } from '@/components/dashboard/LowStockTable'
import { DateFilter, DateFilterOption, getDateRange } from '@/components/dashboard/DateFilter'
import { DollarSign, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const { user, tenant } = useAuth()
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('all')
  const [customDate, setCustomDate] = useState<Date>(new Date())
  
  const dateRange = useMemo(() => getDateRange(dateFilter, customDate), [dateFilter, customDate])
  const { data: kpis, isLoading } = useDashboardKPIs(dateRange.startDate, dateRange.endDate)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: tenant?.settings?.currency || 'USD',
    }).format(amount)
  }

  const getDateDescription = () => {
    const labels: Record<DateFilterOption, string> = {
      all: "",
      today: "today",
      yesterday: "yesterday",
      last7days: "the last 7 days",
      last30days: "the last 30 days",
      thisWeek: "this week",
      lastWeek: "last week",
      thisMonth: "this month",
      lastMonth: "last month",
      custom: `on ${customDate.toLocaleDateString()}`,
    }
    return labels[dateFilter]
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div className="space-y-6" data-tour="dashboard-container">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.full_name}</h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your business {getDateDescription()}
              </p>
            </div>
            <DateFilter 
              value={dateFilter} 
              onChange={setDateFilter}
              customDate={customDate}
              onCustomDateChange={setCustomDate}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-tour="kpi-cards">
            <KPICard
              title="Total Revenue"
              value={formatCurrency(kpis?.totalRevenue || 0)}
              change={kpis?.revenueChange}
              icon={DollarSign}
              loading={isLoading}
              valueType="revenue"
            />
            <KPICard
              title="Total Profit"
              value={formatCurrency(kpis?.totalProfit || 0)}
              change={kpis?.profitChange}
              icon={TrendingUp}
              loading={isLoading}
              valueType="profit"
            />
            <KPICard
              title="Total Sales"
              value={kpis?.totalSales?.toString() || '0'}
              change={kpis?.salesChange}
              icon={ShoppingCart}
              loading={isLoading}
              valueType="neutral"
            />
            <KPICard
              title="Low Stock Items"
              value={kpis?.lowStockCount?.toString() || '0'}
              icon={AlertTriangle}
              loading={isLoading}
              valueType="neutral"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div data-tour="sales-chart">
              <SalesTrendChart />
            </div>
            <div data-tour="low-stock-table">
              <LowStockTable />
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
