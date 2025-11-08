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

export async function getCustomers(tenantId: string, search?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Customer[]
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
