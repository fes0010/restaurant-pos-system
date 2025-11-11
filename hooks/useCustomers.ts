import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerTransactions,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@/lib/services/customers'

export function useCustomers(filters?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['customers', tenant?.id, filters],
    queryFn: () => getCustomers(tenant!.id, filters),
    enabled: !!tenant,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCreateCustomer() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(tenant!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] })
    },
  })
}

export function useCustomerTransactions(customerId: string, limit = 10) {
  return useQuery({
    queryKey: ['customer-transactions', customerId, limit],
    queryFn: () => getCustomerTransactions(customerId, limit),
    enabled: !!customerId,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
