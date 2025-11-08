import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  restockFromPurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@/lib/services/purchase-orders'

export function usePurchaseOrders(filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['purchase-orders', tenant?.id, filters],
    queryFn: () => getPurchaseOrders(tenant!.id, filters),
    enabled: !!tenant,
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => getPurchaseOrder(id),
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) =>
      createPurchaseOrder(tenant!.id, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdatePurchaseOrderInput) => updatePurchaseOrder(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', data.id] })
    },
  })
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'draft' | 'ordered' | 'received' | 'completed' }) =>
      updatePurchaseOrderStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-order', data.id] })
    },
  })
}

export function useRestockFromPurchaseOrder() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (poId: string) => restockFromPurchaseOrder(tenant!.id, user!.id, poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
