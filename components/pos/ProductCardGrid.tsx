'use client'

import { useState, useEffect } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { Product } from '@/types'
import { ProductCard } from './ProductCard'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search } from 'lucide-react'

interface ProductCardGridProps {
  onAddToCart: (product: Product) => void
  onImmediateSale?: (product: Product, customPrice: number) => void
}

export function ProductCardGrid({ onAddToCart, onImmediateSale }: ProductCardGridProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProducts({ 
    search: debouncedSearch,
    archived: false
  })

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, SKU, or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-lg"
          autoFocus
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : data?.products && data.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {data.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onImmediateSale={onImmediateSale}
              />
            ))}
          </div>
        ) : search ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">No products found</h3>
            <p className="text-muted-foreground">
              No products match "{search}"
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Start searching</h3>
            <p className="text-muted-foreground">
              Type to search for products
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
