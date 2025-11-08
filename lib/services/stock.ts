import { createClient } from '@/lib/supabase/client'
import { StockHistory } from '@/types'

export interface StockAdjustmentInput {
  productId: string
  type: 'restock' | 'adjustment'
  quantityChange: number
  reason: string
}

export async function adjustStock(
  tenantId: string,
  userId: string,
  input: StockAdjustmentInput
) {
  const supabase = createClient()

  // Get current product stock
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', input.productId)
    .single()

  if (productError) throw productError

  const newQuantity = Number(product.stock_quantity) + input.quantityChange

  if (newQuantity < 0) {
    throw new Error('Stock quantity cannot be negative')
  }

  // Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newQuantity })
    .eq('id', input.productId)

  if (updateError) throw updateError

  // Create stock history record
  const { data: history, error: historyError } = await supabase
    .from('stock_history')
    .insert({
      tenant_id: tenantId,
      product_id: input.productId,
      type: input.type,
      quantity_change: input.quantityChange,
      quantity_after: newQuantity,
      reason: input.reason,
      created_by: userId,
    })
    .select()
    .single()

  if (historyError) throw historyError

  return history
}

export async function getStockHistory(
  productId: string,
  filters?: {
    type?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = createClient()

  let query = supabase
    .from('stock_history')
    .select('*, users(full_name)', { count: 'exact' })
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    history: data as StockHistory[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}
