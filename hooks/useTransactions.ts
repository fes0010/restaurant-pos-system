import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
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
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['transactions', tenant?.id, filters],
    queryFn: () => getTransactions(tenant!.id, filters),
    enabled: !!tenant,
  })
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
