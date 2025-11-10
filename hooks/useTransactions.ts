import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import {
  getTransactions,
  getTransaction,
  createTransaction,
  CreateTransactionInput,
} from '@/lib/services/transactions'

export function useTransactions(filters?: {
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // For sales persons, automatically filter by their user ID
  // RLS will enforce this, but we add it here for clarity
  const enhancedFilters = {
    ...filters,
    userId: user?.role === 'sales_person' ? user.id : undefined,
  }

  const query = useQuery({
    queryKey: ['transactions', tenant?.id, enhancedFilters],
    queryFn: () => getTransactions(tenant!.id, enhancedFilters),
    enabled: !!tenant,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id) return

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          console.log('Transaction change detected:', payload)
          // Invalidate all transaction queries for this tenant
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, queryClient, supabase])

  return query
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      createTransaction(tenant!.id, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
