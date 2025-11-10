import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  getCategories,
  CreateProductInput,
  UpdateProductInput,
} from '@/lib/services/products'

export function useProducts(filters?: {
  search?: string
  category?: string
  archived?: boolean
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['products', tenant?.id, filters],
    queryFn: () => getProducts(tenant!.id, filters),
    enabled: !!tenant,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      createProduct(tenant!.id, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', data.id] })
    },
  })
}

export function useArchiveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCategories() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => getCategories(tenant!.id),
    enabled: !!tenant,
  })
}
