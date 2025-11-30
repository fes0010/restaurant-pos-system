import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardKPIs, getLowStockProducts, getSalesTrend, getDailySummary } from '@/lib/services/dashboard'

export function useDashboardKPIs(startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['dashboard-kpis', tenant?.id, startDate, endDate],
    queryFn: () => getDashboardKPIs(tenant!.id, startDate, endDate),
    enabled: !!tenant,
    staleTime: 0, // Always consider data stale
    refetchOnMount: 'always', // Always refetch on mount
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useLowStockProducts() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['low-stock-products', tenant?.id],
    queryFn: () => getLowStockProducts(tenant!.id),
    enabled: !!tenant,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useSalesTrend(days: number = 30) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['sales-trend', tenant?.id, days],
    queryFn: () => getSalesTrend(tenant!.id, days),
    enabled: !!tenant,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}


export function useDailySummary() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['daily-summary', tenant?.id],
    queryFn: () => getDailySummary(tenant!.id),
    enabled: !!tenant,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
