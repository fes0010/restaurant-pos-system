'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/inventory/ImageUpload'
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts'
import { toast } from 'sonner'
import { Product } from '@/types'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  is_variable_price: z.boolean(),
  price: z.union([z.number(), z.null()]).optional(),
  cost: z.union([z.number(), z.null()]).optional(),
  base_unit: z.string().min(1, 'Base unit is required'),
  purchase_unit: z.string().min(1, 'Purchase unit is required'),
  unit_conversion_ratio: z.number().min(0.0001, 'Conversion ratio must be positive'),
  stock_quantity: z.number().min(0, 'Stock quantity must be non-negative'),
  low_stock_threshold: z.number().min(0, 'Threshold must be non-negative'),
  image_url: z.string().optional(),
}).refine((data) => {
  // If not variable price, price must be provided and positive
  if (!data.is_variable_price && (!data.price || data.price <= 0)) {
    return false
  }
  // If not variable price, cost should be provided
  if (!data.is_variable_price && (data.cost === null || data.cost === undefined || data.cost < 0)) {
    return false
  }
  return true
}, {
  message: 'Price and cost are required for fixed-price products',
  path: ['price'],
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductForm({ product, open, onOpenChange }: ProductFormProps) {
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEditing = !!product
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isVariablePrice, setIsVariablePrice] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category: '',
      is_variable_price: false,
      price: 0,
      cost: 0,
      base_unit: 'piece',
      purchase_unit: 'piece',
      unit_conversion_ratio: 1,
      stock_quantity: 0,
      low_stock_threshold: 10,
      image_url: '',
    },
  })

  // Watch is_variable_price to update local state
  const watchVariablePrice = watch('is_variable_price')

  useEffect(() => {
    if (product) {
      const isVarPrice = product.is_variable_price || false
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        category: product.category,
        is_variable_price: isVarPrice,
        price: product.price !== null ? Number(product.price) : null,
        cost: Number(product.cost),
        base_unit: product.base_unit,
        purchase_unit: product.purchase_unit,
        unit_conversion_ratio: Number(product.unit_conversion_ratio),
        stock_quantity: Number(product.stock_quantity),
        low_stock_threshold: Number(product.low_stock_threshold),
        image_url: product.image_url || '',
      })
      setImageUrl(product.image_url || '')
      setIsVariablePrice(isVarPrice)
    } else {
      reset()
      setImageUrl('')
      setIsVariablePrice(false)
    }
  }, [product, reset])

  useEffect(() => {
    setIsVariablePrice(watchVariablePrice || false)
  }, [watchVariablePrice])

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
    setValue('image_url', url)
  }

  async function onSubmit(data: ProductFormData) {
    try {
      const submitData = {
        ...data,
        price: data.price ?? null,
        cost: data.cost ?? null,
      }
      
      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, ...submitData })
        toast.success('Product updated successfully')
      } else {
        await createProduct.mutateAsync(submitData)
        toast.success('Product created successfully')
      }
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} product`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ImageUpload
            currentImageUrl={imageUrl}
            onUpload={handleImageUpload}
            productId={product?.id}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input {...register('sku')} id="sku" placeholder="PROD-001" />
              {errors.sku && <p className="mt-1 text-sm text-destructive">{errors.sku.message}</p>}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input {...register('category')} id="category" placeholder="Main Course" />
              {errors.category && <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input {...register('name')} id="name" placeholder="Fried Fish" />
            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              {...register('description')}
              id="description"
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Product description"
            />
          </div>

          <div className="flex items-start space-x-2 p-3 border border-border rounded-md bg-muted/50">
            <input
              type="checkbox"
              id="is_variable_price"
              {...register('is_variable_price')}
              className="mt-1 h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <Label htmlFor="is_variable_price" className="cursor-pointer font-medium">
                Variable Price Product
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Price will be entered at point of sale and completes sale immediately (bypasses cart)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">
                Price {!isVariablePrice && '*'}
                {isVariablePrice && <span className="text-xs text-muted-foreground ml-1">(Optional)</span>}
              </Label>
              <Input 
                {...register('price', { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === '' ? null : Number(v)
                })} 
                id="price" 
                type="number" 
                step="0.01" 
                placeholder={isVariablePrice ? "Will be set at POS" : "0.00"}
                disabled={isVariablePrice}
              />
              {errors.price && <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div>
              <Label htmlFor="cost">
                Cost {!isVariablePrice && '*'}
                {isVariablePrice && <span className="text-xs text-muted-foreground ml-1">(Optional)</span>}
              </Label>
              <Input 
                {...register('cost', { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === '' ? null : Number(v)
                })} 
                id="cost" 
                type="number" 
                step="0.01" 
                placeholder={isVariablePrice ? "Not required" : "0.00"}
                disabled={isVariablePrice}
              />
              {errors.cost && <p className="mt-1 text-sm text-destructive">{errors.cost.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_unit">Base Unit *</Label>
              <Input {...register('base_unit')} id="base_unit" placeholder="piece, kg, liter" />
              {errors.base_unit && <p className="mt-1 text-sm text-destructive">{errors.base_unit.message}</p>}
            </div>

            <div>
              <Label htmlFor="purchase_unit">Purchase Unit *</Label>
              <Input {...register('purchase_unit')} id="purchase_unit" placeholder="piece, kg, liter" />
              {errors.purchase_unit && <p className="mt-1 text-sm text-destructive">{errors.purchase_unit.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="unit_conversion_ratio">Unit Conversion Ratio *</Label>
            <Input {...register('unit_conversion_ratio', { valueAsNumber: true })} id="unit_conversion_ratio" type="number" step="0.0001" placeholder="1" />
            <p className="text-xs text-muted-foreground mt-1">
              How many base units in one purchase unit (e.g., 1 kg = 5 pieces)
            </p>
            {errors.unit_conversion_ratio && <p className="mt-1 text-sm text-destructive">{errors.unit_conversion_ratio.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock_quantity">Initial Stock *</Label>
              <Input {...register('stock_quantity', { valueAsNumber: true })} id="stock_quantity" type="number" step="0.01" placeholder="0" />
              {errors.stock_quantity && <p className="mt-1 text-sm text-destructive">{errors.stock_quantity.message}</p>}
            </div>

            <div>
              <Label htmlFor="low_stock_threshold">Low Stock Alert *</Label>
              <Input {...register('low_stock_threshold', { valueAsNumber: true })} id="low_stock_threshold" type="number" step="0.01" placeholder="10" />
              {errors.low_stock_threshold && <p className="mt-1 text-sm text-destructive">{errors.low_stock_threshold.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
