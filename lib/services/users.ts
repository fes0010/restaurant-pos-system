import { createClient } from '@/lib/supabase/client'

export interface User {
  id: string
  tenant_id: string
  email: string
  full_name: string
  role: 'admin' | 'sales_person'
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'sales_person'
}

export interface UpdateUserData {
  email?: string
  full_name?: string
  role?: 'admin' | 'sales_person'
}

export async function getUsers(
  tenantId: string,
  filters?: {
    role?: string
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
    .from('users')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.role) {
    query = query.eq('role', filters.role)
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) throw error

  return {
    users: data as User[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getUserById(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as User
}

export async function createUser(tenantId: string, data: CreateUserData) {
  const supabase = createClient()
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        tenant_id: tenantId,
        role: data.role,
      },
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('Failed to create user')

  // The user record in the users table will be created automatically by the trigger
  // Wait a moment for the trigger to complete
  await new Promise(resolve => setTimeout(resolve, 500))

  // Fetch the created user
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (userError) throw userError
  return userData as User
}

export async function updateUser(userId: string, data: UpdateUserData) {
  const supabase = createClient()
  
  const { data: userData, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return userData as User
}

export async function deleteUser(userId: string) {
  const supabase = createClient()
  
  // Check if this is the last admin
  const { data: user } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()

  if (user?.role === 'admin') {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)
      .eq('role', 'admin')

    if (count === 1) {
      throw new Error('Cannot delete the last admin user')
    }
  }

  // Delete from auth (this will cascade to users table via trigger)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  
  if (error) throw error
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw error
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const supabase = createClient()
  
  // First verify current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('User not found')

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) throw new Error('Current password is incorrect')

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}
