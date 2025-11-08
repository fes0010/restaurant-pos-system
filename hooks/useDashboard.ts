import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { getDashboardKPIs, getLowStockProducts, getSalesTrend } from '@/lib/services/dashboard'

export function useDashboardKPIs(startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['dashboard-kpis', tenant?.id, startDate, endDate],
    queryFn: () => getDashboardKPIs(tenant!.id, startDate, endDate),
    enabled: !!tenant,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useLowStockProducts() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['low-stock-products', tenant?.id],
    queryFn: () => getLowStockProducts(tenant!.id),
    enabled: !!tenant,
  })
}

export function useSalesTrend(days: number = 30) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['sales-trend', tenant?.id, days],
    queryFn: () => getSalesTrend(tenant!.id, days),
    enabled: !!tenant,
  })
}
