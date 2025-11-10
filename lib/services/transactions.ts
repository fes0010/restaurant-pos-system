import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionItem } from '@/types'

export interface CreateTransactionInput {
  customer_id?: string
  served_by?: string
  items: {
    product_id: string
    product_name: string
    product_sku: string
    quantity: number
    unit_price: number
  }[]
  subtotal: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  total: number
  payment_method: 'cash' | 'mpesa' | 'bank' | 'debt'
  amount_tendered?: number
}

export async function createTransaction(
  tenantId: string,
  userId: string,
  input: CreateTransactionInput
) {
  const supabase = createClient()

  // Start a transaction by creating the main transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      tenant_id: tenantId,
      customer_id: input.customer_id || null,
      subtotal: input.subtotal,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      discount_amount: input.discount_amount,
      total: input.total,
      payment_method: input.payment_method,
      status: input.payment_method === 'debt' ? 'debt_pending' : 'completed',
      created_by: userId,
      served_by: input.served_by || userId,
    } as any)
    .select()
    .single()

  if (transactionError) throw transactionError

  // Create transaction items
  const itemsToInsert = input.items.map((item) => ({
    tenant_id: tenantId,
    transaction_id: transaction.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  // Update product stock quantities and create stock history
  for (const item of input.items) {
    // Get current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    const newStock = Number(product?.stock_quantity || 0) - item.quantity

    // Decrease stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    if (stockError) throw stockError

    // Create stock history
    const { error: historyError } = await supabase
      .from('stock_history')
      .insert({
        tenant_id: tenantId,
        product_id: item.product_id,
        type: 'sale',
        quantity_change: -item.quantity,
        quantity_after: newStock,
        reason: `Sale - Transaction ${transaction.transaction_number}`,
        reference_id: transaction.id,
        created_by: userId,
      })

    if (historyError) throw historyError
  }

  // Update customer total purchases if customer is provided
  if (input.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_purchases')
      .eq('id', input.customer_id)
      .single()

    const newTotal = Number(customer?.total_purchases || 0) + input.total

    const { error: customerError } = await supabase
      .from('customers')
      .update({ total_purchases: newTotal })
      .eq('id', input.customer_id)

    if (customerError) throw customerError
  }

  // Fetch the complete transaction with items
  const { data: completeTransaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(*)')
    .eq('id', transaction.id)
    .single()

  if (fetchError) throw fetchError

  // Fetch customer separately if needed
  let customer = null
  if (input.customer_id) {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', input.customer_id)
      .single()
    customer = customerData
  }

  return { ...completeTransaction, customer } as any
}

export async function getTransactions(
  tenantId: string,
  filters?: {
    dateFrom?: string
    dateTo?: string
    paymentMethod?: string
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = createClient()

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Apply date filters
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  // Apply payment method filter
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod)
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`transaction_number.ilike.%${filters.search}%`)
  }

  // Apply pagination
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  // Fetch customers and served_by users for transactions
  const transactionsWithDetails = await Promise.all(
    (data || []).map(async (transaction: any) => {
      const result: any = { ...transaction }
      
      // Fetch customer if exists
      if (transaction.customer_id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', transaction.customer_id)
          .single()
        result.customer = customer
      }
      
      // Fetch served_by user if exists
      if (transaction.served_by) {
        const { data: servedByUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', transaction.served_by)
          .single()
        result.served_by_user = servedByUser
      }
      
      return result
    })
  )

  return {
    transactions: transactionsWithDetails as any,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getTransaction(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(*)')
    .eq('id', id)
    .single()

  if (error) throw error

  // Fetch customer separately if needed
  let customer = null
  if (data.customer_id) {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', data.customer_id)
      .single()
    customer = customerData
  }

  // Fetch served_by user if needed
  let servedByUser = null
  const dataWithServedBy = data as any
  if (dataWithServedBy.served_by) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', dataWithServedBy.served_by)
      .single()
    servedByUser = userData
  }

  return { ...data, customer, served_by_user: servedByUser } as any
}
