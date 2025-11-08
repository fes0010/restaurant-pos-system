'use client'

import { useState } from 'react'
import { useProducts, useCategories, useArchiveProduct } from '@/hooks/useProducts'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProductForm } from './ProductForm'
import { StockAdjustmentModal } from './StockAdjustmentModal'
import { StockHistoryDrawer } from './StockHistoryDrawer'
import { exportToCSV, formatDateTimeForCSV } from '@/lib/utils/csv'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Archive, 
  TrendingUp, 
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export function ProductList() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const pageSize = 20
  const { data, isLoading } = useProducts({ 
    search, 
    category: category === 'all' ? undefined : category,
    page,
    pageSize
  })
  const { data: categories = [] } = useCategories()
  const archiveProduct = useArchiveProduct()

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  const handleStockAdjustment = (product: Product) => {
    setSelectedProduct(product)
    setIsStockModalOpen(true)
  }

  const handleViewHistory = (product: Product) => {
    setSelectedProduct(product)
    setIsHistoryOpen(true)
  }

  const handleArchive = async (product: Product) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"?`)) return

    try {
      await archiveProduct.mutateAsync(product.id)
      toast.success('Product archived successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive product')
    }
  }

  const handleExportCSV = () => {
    if (!data?.products || data.products.length === 0) {
      toast.error('No products to export')
      return
    }

    try {
      const exportData = data.products.map(product => ({
        SKU: product.sku,
        Name: product.name,
        Description: product.description || '',
        Category: product.category,
        Price: Number(product.price).toFixed(2),
        Cost: Number(product.cost).toFixed(2),
        'Base Unit': product.base_unit,
        'Purchase Unit': product.purchase_unit,
        'Conversion Ratio': Number(product.unit_conversion_ratio),
        'Stock Quantity': Number(product.stock_quantity),
        'Low Stock Threshold': Number(product.low_stock_threshold),
        'Created At': formatDateTimeForCSV(product.created_at),
        'Updated At': formatDateTimeForCSV(product.updated_at),
      }))

      const timestamp = new Date().toISOString().split('T')[0]
      exportToCSV(exportData, `products-${timestamp}.csv`)
      toast.success('Products exported successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products')
    }
  }

  const formatCurrency = (value: number | string) => {
    return `KES ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStockStatus = (product: Product) => {
    const stock = Number(product.stock_quantity)
    const threshold = Number(product.low_stock_threshold)
    
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const }
    if (stock <= threshold) return { label: 'Low Stock', variant: 'secondary' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} total products
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!data?.products?.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(value) => {
          setCategory(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : !data?.products || data.products.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">
            {search || category !== 'all' ? 'No products found matching your filters' : 'No products yet. Create your first product to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((product) => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-right">
                        {Number(product.stock_quantity).toFixed(2)} {product.base_unit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStockAdjustment(product)}
                            title="Adjust stock"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(product)}
                            title="View history"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(product)}
                            title="Archive product"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ProductForm
        product={selectedProduct}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
      
      {selectedProduct && (
        <>
          <StockAdjustmentModal
            product={selectedProduct}
            open={isStockModalOpen}
            onOpenChange={setIsStockModalOpen}
          />
          <StockHistoryDrawer
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
          />
        </>
      )}
    </div>
  )
}
