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
      // Set outstanding_balance to total for debt payments, 0 for completed payments
      outstanding_balance: input.payment_method === 'debt' ? input.total : 0,
      created_by: userId,
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
    userId?: string // Optional: filter by specific user (for sales persons)
  }
) {
  const supabase = createClient()

  // Use a single query with joins for better performance
  let query = supabase
    .from('transactions')
    .select(`
      *,
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Filter by user if provided (RLS will also enforce this for sales persons)
  if (filters?.userId) {
    query = query.eq('created_by', filters.userId)
  }

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

  return {
    transactions: data as any,
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
    .select(`
      *,
      items:transaction_items(*),
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data as any
}

export async function createImmediateSale(
  tenantId: string,
  userId: string,
  productId: string,
  productName: string,
  productSku: string,
  customPrice: number,
  customerId?: string
) {
  const supabase = createClient()

  // Validate price
  if (customPrice <= 0) {
    throw new Error('Invalid price: must be greater than 0')
  }

  // Check stock availability
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) throw productError

  if (!product?.is_variable_price) {
    throw new Error('Product is not configured for variable pricing')
  }

  if (Number(product?.stock_quantity || 0) <= 0) {
    throw new Error('Product is out of stock')
  }

  // Create transaction with single item
  const transactionInput: CreateTransactionInput = {
    customer_id: customerId,
    served_by: userId,
    items: [{
      product_id: productId,
      product_name: productName,
      product_sku: productSku,
      quantity: 1,
      unit_price: customPrice,
    }],
    subtotal: customPrice,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    total: customPrice,
    payment_method: 'cash', // Default to cash for immediate sales
  }

  return createTransaction(tenantId, userId, transactionInput)
}
