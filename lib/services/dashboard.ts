import { createClient } from '@/lib/supabase/client'

export interface DashboardKPIs {
  totalRevenue: number
  totalProfit: number
  totalSales: number
  lowStockCount: number
  revenueChange: number
  profitChange: number
  salesChange: number
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  base_unit: string
}

export async function getDashboardKPIs(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DashboardKPIs> {
  const supabase = createClient()

  // Get date range for current period
  const now = new Date()
  const currentStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1)
  const currentEnd = endDate || now

  // Get previous period for comparison
  const periodLength = currentEnd.getTime() - currentStart.getTime()
  const previousStart = new Date(currentStart.getTime() - periodLength)
  const previousEnd = currentStart

  // Fetch current period transactions
  const { data: currentTransactions } = await supabase
    .from('transactions')
    .select('total, subtotal, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString())

  // Fetch previous period transactions
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('total')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString())

  // Calculate current period metrics
  const totalRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  const totalSales = currentTransactions?.length || 0

  // Calculate profit (revenue - cost)
  let totalProfit = 0
  currentTransactions?.forEach((transaction: any) => {
    const items = transaction.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      totalProfit += revenue - itemCost
    })
  })

  // Calculate previous period metrics for comparison
  const previousRevenue = previousTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  const previousSales = previousTransactions?.length || 0

  // Calculate percentage changes
  const revenueChange = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0
  const salesChange = previousSales > 0 
    ? ((totalSales - previousSales) / previousSales) * 100 
    : 0
  const profitChange = 0 // Would need previous profit calculation

  // Get low stock count
  const { count: lowStockCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .filter('stock_quantity', 'lte', 'low_stock_threshold')

  return {
    totalRevenue,
    totalProfit,
    totalSales,
    lowStockCount: lowStockCount || 0,
    revenueChange,
    profitChange,
    salesChange,
  }
}

export async function getLowStockProducts(tenantId: string): Promise<LowStockProduct[]> {
  const supabase = createClient()

  // Get products where stock is at or below their threshold
  const { data } = await supabase
    .from('products')
    .select('id, name, sku, stock_quantity, low_stock_threshold, base_unit')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)
    .order('stock_quantity', { ascending: true })

  // Filter in JavaScript to compare stock_quantity with low_stock_threshold
  const lowStockProducts = (data || []).filter(
    product => product.stock_quantity <= product.low_stock_threshold
  ).slice(0, 10)

  return lowStockProducts
}

export async function getSalesTrend(
  tenantId: string,
  days: number = 30
): Promise<{ date: string; revenue: number; sales: number }[]> {
  const supabase = createClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('created_at, total')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  // Group by date
  const grouped = new Map<string, { revenue: number; sales: number }>()
  
  transactions?.forEach((t) => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    const existing = grouped.get(date) || { revenue: 0, sales: 0 }
    grouped.set(date, {
      revenue: existing.revenue + Number(t.total),
      sales: existing.sales + 1,
    })
  })

  return Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}
