'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLowStockProducts } from '@/hooks/useDashboard'
import { Package, AlertTriangle } from 'lucide-react'
import { StockDisplay } from '@/components/ui/value-display'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
          {products.map((product) => {
            const stockQty = Number(product.stock_quantity)
            const threshold = Number(product.low_stock_threshold)
            const isOutOfStock = stockQty <= 0
            
            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isOutOfStock ? "bg-stock-out/10" : "bg-stock-low/10"
                  )}>
                    <AlertTriangle className={cn(
                      "h-5 w-5",
                      isOutOfStock ? "text-stock-out" : "text-stock-low"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StockDisplay
                    quantity={stockQty}
                    threshold={threshold}
                    unit={product.base_unit}
                    className="text-sm"
                  />
                </div>
              </div>
            )
          })}
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
