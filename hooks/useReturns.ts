import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  createReturn,
  getReturns,
  getReturnById,
  approveReturn,
  rejectReturn,
  revertReturnToPending,
  CreateReturnData,
} from '@/lib/services/returns'

export function useReturns(filters?: {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['returns', tenant?.id, filters],
    queryFn: () => getReturns(tenant!.id, filters),
    enabled: !!tenant,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useReturn(returnId: string) {
  return useQuery({
    queryKey: ['return', returnId],
    queryFn: () => getReturnById(returnId),
    enabled: !!returnId,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCreateReturn() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReturnData) =>
      createReturn(tenant!.id, user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
    },
  })
}

export function useApproveReturn() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => approveReturn(returnId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.refetchQueries({ queryKey: ['returns'], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' })
    },
  })
}

export function useRejectReturn() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => rejectReturn(returnId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
    },
  })
}

export function useRevertReturnToPending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => revertReturnToPending(returnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.refetchQueries({ queryKey: ['returns'], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      queryClient.refetchQueries({ queryKey: ['dashboard'], type: 'active' })
    },
  })
}
