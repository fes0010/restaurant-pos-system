import { createClient } from '@/lib/supabase/client'

export interface ReturnItem {
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CreateReturnData {
  transaction_id: string
  reason: string
  items: ReturnItem[]
}

export interface Return {
  id: string
  tenant_id: string
  return_number: string
  transaction_id: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  total_amount: number
  created_by: string
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  transaction?: {
    transaction_number: string
    customer?: {
      name: string
    }
  }
  return_items?: ReturnItemDetail[]
  created_by_user?: {
    full_name: string
  }
  approved_by_user?: {
    full_name: string
  }
}

export interface ReturnItemDetail {
  id: string
  return_id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product?: {
    name: string
    sku: string
  }
}

export async function createReturn(tenantId: string, userId: string, data: CreateReturnData) {
  const supabase = createClient()
  
  const totalAmount = data.items.reduce((sum, item) => sum + item.subtotal, 0)

  // Create return record
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .insert({
      tenant_id: tenantId,
      transaction_id: data.transaction_id,
      status: 'pending',
      reason: data.reason,
      total_amount: totalAmount,
      created_by: userId,
    } as any)
    .select()
    .single()

  if (returnError) throw returnError

  // Create return items
  const returnItems = data.items.map(item => ({
    return_id: returnData.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
  }))

  const { error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItems as any)

  if (itemsError) throw itemsError

  return returnData
}

export async function getReturns(
  tenantId: string,
  filters?: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = createClient()
  
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('returns')
    .select(`
      *,
      transaction:transactions(
        transaction_number,
        customer:customers(name)
      ),
      return_items(
        *,
        product:products(name, sku)
      ),
      created_by_user:users!returns_created_by_fkey(full_name),
      approved_by_user:users!returns_approved_by_fkey(full_name)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`return_number.ilike.%${filters.search}%,reason.ilike.%${filters.search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  return {
    returns: data as any as Return[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getReturnById(returnId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      transaction:transactions(
        transaction_number,
        customer:customers(name)
      ),
      return_items(
        *,
        product:products(name, sku)
      ),
      created_by_user:users!returns_created_by_fkey(full_name),
      approved_by_user:users!returns_approved_by_fkey(full_name)
    `)
    .eq('id', returnId)
    .single()

  if (error) throw error
  return data as any as Return
}

export async function approveReturn(returnId: string, userId: string) {
  const supabase = createClient()
  
  // Update return status
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', returnId)
    .select(`
      *,
      return_items(
        product_id,
        quantity
      )
    `)
    .single()

  if (returnError) throw returnError

  // Update stock quantities for each returned item
  for (const item of (returnData.return_items || []) as unknown as any[]) {
    // Get current stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    if (productError) throw productError

    const newStock = Number(product.stock_quantity) + item.quantity

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    if (updateError) throw updateError

    // Create stock history record
    const { error: historyError } = await supabase
      .from('stock_history')
      .insert({
        tenant_id: returnData.tenant_id,
        product_id: item.product_id,
        type: 'return',
        quantity_change: item.quantity,
        quantity_after: newStock,
        reason: `Return approved: ${returnData.return_number}`,
        reference_id: returnId,
        created_by: userId,
      })

    if (historyError) throw historyError
  }

  return returnData
}

export async function rejectReturn(returnId: string, userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'rejected',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', returnId)
    .select()
    .single()

  if (error) throw error
  return data
}
