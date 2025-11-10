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
  // Use API route to bypass RLS
  const params = new URLSearchParams()
  if (filters?.role) params.append('role', filters.role)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())

  const response = await fetch(`/api/users?${params.toString()}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch users')
  }

  return response.json()
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
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create user')
  }

  return response.json() as Promise<User>
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
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete user')
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const response = await fetch(`/api/users/${userId}/password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to change password')
  }
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
