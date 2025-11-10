import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'

export interface CreateCustomerInput {
  name: string
  phone?: string
  email?: string
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string
}

export async function getCustomers(
  tenantId: string,
  filters?: {
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  // Apply pagination
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error
  
  return {
    customers: data as Customer[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getCustomer(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Customer
}

export async function createCustomer(tenantId: string, input: CreateCustomerInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      ...input,
      total_purchases: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function updateCustomer(input: UpdateCustomerInput) {
  const supabase = createClient()
  
  const { id, ...updates } = input
  
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function getCustomerTransactions(customerId: string, limit = 10) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
