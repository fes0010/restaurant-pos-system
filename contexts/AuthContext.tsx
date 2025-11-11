'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User, Tenant } from '@/types'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user)
        loadUserData(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      if (session?.user) {
        setSupabaseUser(session.user)
        loadUserData(session.user.id)
      } else {
        setSupabaseUser(null)
        setUser(null)
        setTenant(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function loadUserData(userId: string) {
    try {
      console.log('Loading user data for:', userId)
      
      // Add a small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('User query result:', { userData, userError })

      if (userError) {
        console.error('User error details:', userError)
        // If it's an RLS error, sign out the user
        if (userError.code === 'PGRST116' || userError.message?.includes('row-level security')) {
          console.error('RLS policy blocking user access - signing out')
          await signOut()
          return
        }
        throw userError
      }

      if (!userData) {
        console.error('No user data returned - signing out')
        await signOut()
        return
      }

      setUser(userData as User)

      // Fetch tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', userData.tenant_id)
        .single()

      console.log('Tenant query result:', { tenantData, tenantError })

      if (tenantError) {
        console.error('Tenant error details:', tenantError)
        throw tenantError
      }

      if (!tenantData) {
        throw new Error('No tenant data returned')
      }

      setTenant(tenantData as Tenant)
      console.log('User data loaded successfully')
    } catch (error: any) {
      console.error('Error loading user data:', error)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      console.error('Error details:', error?.details)
      // Don't sign out on other errors, just set loading to false
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    setTenant(null)
    setSupabaseUser(null)
  }

  async function changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) throw error
  }

  const value = {
    user,
    tenant,
    supabaseUser,
    loading,
    signIn,
    signOut,
    changePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
