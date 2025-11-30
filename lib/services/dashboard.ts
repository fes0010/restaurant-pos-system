import { createClient } from '@/lib/supabase/client'

export interface DashboardKPIs {
  totalRevenue: number
  totalProfit: number
  totalSales: number
  lowStockCount: number
  revenueChange: number
  profitChange: number
  salesChange: number
  grossRevenue: number
  totalReturns: number
  totalExpenses: number
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

  // Build transaction query
  let transactionQuery = supabase
    .from('transactions')
    .select('total, subtotal, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')

  // Only apply date filters if dates are provided
  if (startDate) {
    transactionQuery = transactionQuery.gte('created_at', currentStart.toISOString())
  }
  if (endDate) {
    transactionQuery = transactionQuery.lte('created_at', currentEnd.toISOString())
  }

  const { data: currentTransactions } = await transactionQuery

  // Fetch previous period transactions for comparison
  const { data: previousTransactions } = await supabase
    .from('transactions')
    .select('total')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', previousStart.toISOString())
    .lte('created_at', previousEnd.toISOString())

  // Fetch approved returns with their original transaction date
  const { data: approvedReturns } = await supabase
    .from('returns')
    .select('total_amount, return_items(quantity, unit_price, product_id, products(cost)), transaction:transactions(created_at)')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')

  // Calculate total returns amount and profit loss (only for returns whose original transaction is in the date range)
  let totalReturnsAmount = 0
  let returnsProfitLoss = 0
  
  approvedReturns?.forEach((returnItem: any) => {
    // Use the original transaction's created_at date
    const transactionDate = returnItem.transaction?.created_at
    if (!transactionDate) return
    
    const txDate = new Date(transactionDate)
    // Only include if the original transaction date is within our date range
    if (startDate && txDate < currentStart) return
    if (endDate && txDate > currentEnd) return
    
    totalReturnsAmount += Number(returnItem.total_amount)
    
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnsProfitLoss += revenue - itemCost
    })
  })

  // Fetch expenses for the period
  let expensesQuery = supabase
    .from('expenses')
    .select('amount, expense_date')
    .eq('tenant_id', tenantId)

  if (startDate) {
    expensesQuery = expensesQuery.gte('expense_date', currentStart.toISOString().split('T')[0])
  }
  if (endDate) {
    expensesQuery = expensesQuery.lte('expense_date', currentEnd.toISOString().split('T')[0])
  }

  const { data: expenses } = await expensesQuery
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Calculate current period metrics
  const grossRevenue = currentTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  const totalRevenue = grossRevenue - totalReturnsAmount - totalExpenses
  const totalSales = currentTransactions?.length || 0

  // Calculate profit (revenue - cost) minus returns profit loss minus expenses
  // Note: For profit, we subtract the profit lost from returns (not the full return amount)
  // because when a return happens, we get the product back (recover the cost)
  let grossProfit = 0
  currentTransactions?.forEach((transaction: any) => {
    const items = transaction.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      grossProfit += revenue - itemCost
    })
  })
  const totalProfit = grossProfit - returnsProfitLoss - totalExpenses

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
    grossRevenue,
    totalReturns: totalReturnsAmount,
    totalExpenses,
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
): Promise<{ date: string; revenue: number; profit: number; sales: number }[]> {
  const supabase = createClient()
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('created_at, total, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  // Fetch approved returns with their original transaction date
  const { data: approvedReturns } = await supabase
    .from('returns')
    .select('transaction_id, total_amount, return_items(quantity, unit_price, product_id, products(cost)), transaction:transactions(created_at)')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')

  // Group transactions by date
  const grouped = new Map<string, { revenue: number; profit: number; sales: number }>()
  
  transactions?.forEach((t: any) => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    const existing = grouped.get(date) || { revenue: 0, profit: 0, sales: 0 }
    
    // Calculate profit for this transaction
    let transactionProfit = 0
    const items = t.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      transactionProfit += revenue - itemCost
    })
    
    grouped.set(date, {
      revenue: existing.revenue + Number(t.total),
      profit: existing.profit + transactionProfit,
      sales: existing.sales + 1,
    })
  })

  // Subtract returns from revenue and profit using the ORIGINAL TRANSACTION DATE
  approvedReturns?.forEach((returnItem: any) => {
    // Use the original transaction's created_at date, not the return approval date
    const transactionDate = returnItem.transaction?.created_at
    if (!transactionDate) return
    
    const date = new Date(transactionDate).toISOString().split('T')[0]
    // Only process if the transaction date is within our date range
    if (date < startDate.toISOString().split('T')[0] || date > endDate.toISOString().split('T')[0]) return
    
    const existing = grouped.get(date) || { revenue: 0, profit: 0, sales: 0 }
    
    // Calculate profit loss from return
    let returnProfitLoss = 0
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnProfitLoss += revenue - itemCost
    })
    
    grouped.set(date, {
      revenue: existing.revenue - Number(returnItem.total_amount),
      profit: existing.profit - returnProfitLoss,
      sales: existing.sales,
    })
  })

  return Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    ...data,
  }))
}


export interface DailySummary {
  grossSales: number
  grossProfit: number
  returns: number
  returnsProfitLoss: number
  expenses: number
  transactionCount: number
}

export async function getDailySummary(tenantId: string): Promise<DailySummary> {
  const supabase = createClient()

  // Get today's date range
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

  // Fetch today's completed transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('total, transaction_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString())

  // Calculate gross sales and profit
  let grossSales = 0
  let grossProfit = 0
  
  transactions?.forEach((t: any) => {
    grossSales += Number(t.total)
    const items = t.transaction_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      grossProfit += revenue - itemCost
    })
  })

  // Fetch today's approved returns (by approval date for daily tracking)
  const { data: returns } = await supabase
    .from('returns')
    .select('total_amount, return_items(quantity, unit_price, product_id, products(cost))')
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')
    .gte('approved_at', startOfDay.toISOString())
    .lte('approved_at', endOfDay.toISOString())

  let totalReturns = 0
  let returnsProfitLoss = 0
  
  returns?.forEach((returnItem: any) => {
    totalReturns += Number(returnItem.total_amount)
    const items = returnItem.return_items || []
    items.forEach((item: any) => {
      const cost = item.products?.cost || 0
      const revenue = Number(item.unit_price) * Number(item.quantity)
      const itemCost = Number(cost) * Number(item.quantity)
      returnsProfitLoss += revenue - itemCost
    })
  })

  // Fetch today's expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('tenant_id', tenantId)
    .gte('expense_date', startOfDay.toISOString().split('T')[0])
    .lte('expense_date', endOfDay.toISOString().split('T')[0])

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  return {
    grossSales,
    grossProfit,
    returns: totalReturns,
    returnsProfitLoss,
    expenses: totalExpenses,
    transactionCount: transactions?.length || 0,
  }
}
