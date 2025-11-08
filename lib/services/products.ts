import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'

export interface CreateProductInput {
  sku: string
  name: string
  description?: string
  category: string
  price: number
  cost: number
  base_unit: string
  purchase_unit: string
  unit_conversion_ratio: number
  stock_quantity: number
  low_stock_threshold: number
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

export async function getProducts(tenantId: string, filters?: {
  search?: string
  category?: string
  archived?: boolean
  page?: number
  pageSize?: number
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('is_archived', filters?.archived ?? false)
    .order('created_at', { ascending: false })

  // Apply search filter
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  // Apply category filter
  if (filters?.category) {
    query = query.eq('category', filters.category)
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
    products: data as Product[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product
}

export async function createProduct(tenantId: string, userId: string, input: CreateProductInput) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      ...input,
    })
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(input: UpdateProductInput) {
  const supabase = createClient()
  
  const { id, ...updates } = input
  
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function archiveProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function getCategories(tenantId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)

  if (error) throw error

  // Get unique categories
  const categories = [...new Set(data.map(p => p.category))].filter(Boolean)
  return categories
}
