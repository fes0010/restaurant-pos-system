'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLowStockProducts } from '@/hooks/useDashboard'
import { Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function LowStockTable() {
  const { data: products, isLoading } = useLowStockProducts()

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Low Stock Alert</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Low Stock Alert</h2>
        <Link href="/inventory">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-destructive">
                  {product.stock_quantity} left
                </p>
                <p className="text-xs text-muted-foreground">
                  Min: {product.low_stock_threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            All products are well stocked
          </p>
        </div>
      )}
    </Card>
  )
}
