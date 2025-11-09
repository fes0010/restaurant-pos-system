'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const isOutOfStock = Number(product.stock_quantity) <= 0
  const isLowStock = Number(product.stock_quantity) <= Number(product.low_stock_threshold)

  const formatCurrency = (value: number | string) => {
    return `KES ${Number(value).toLocaleString('en-KE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      setIsPressed(true)
      onAddToCart(product)
      setTimeout(() => setIsPressed(false), 200)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Get optimized image URL with transformations
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return url
    
    // Check if it's a Supabase Storage URL
    if (url.includes('/storage/v1/object/public/')) {
      // Add transformation parameters for thumbnail
      const transformParams = '?width=400&height=400&resize=cover&quality=80'
      return url + transformParams
    }
    
    return url
  }

  const imageUrl = product.image_url ? getOptimizedImageUrl(product.image_url) : null

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-card border rounded-lg overflow-hidden transition-all duration-200',
        isOutOfStock 
          ? 'opacity-60 cursor-not-allowed' 
          : 'hover:border-primary hover:shadow-md cursor-pointer',
        isPressed && 'scale-95'
      )}
      onClick={handleAddToCart}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square bg-muted">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 text-xs font-semibold px-2 py-1 rounded">
            Low Stock
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-3 space-y-2">
        {/* Product Name */}
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price and Stock Info */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <span className={cn(
              'text-xs',
              isOutOfStock 
                ? 'text-destructive font-medium' 
                : isLowStock 
                ? 'text-yellow-600 dark:text-yellow-500' 
                : 'text-muted-foreground'
            )}>
              {isOutOfStock 
                ? 'Out of Stock' 
                : `${Number(product.stock_quantity).toFixed(0)} ${product.base_unit}`
              }
            </span>
          </div>

          {/* Add to Cart Button */}
          {!isOutOfStock && (
            <Button
              size="sm"
              className="h-11 w-11 rounded-full p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleAddToCart()
              }}
              disabled={isOutOfStock}
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
