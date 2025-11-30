'use client'

import { useEffect, useRef } from 'react'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Minus, Plus, Trash2, ShoppingCart, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CartItem {
  product: Product
  quantity: number
  customPrice?: number // Optional custom price override
}

interface FloatingCartProps {
  items: CartItem[]
  discount: number
  isExpanded: boolean
  onToggle: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdatePrice: (productId: string, price: number) => void
  onRemoveItem: (productId: string) => void
  onUpdateDiscount: (discount: number) => void
  onClearCart: () => void
  onCheckout: () => void
}

export function FloatingCart({
  items,
  discount,
  isExpanded,
  onToggle,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onUpdateDiscount,
  onClearCart,
  onCheckout,
}: FloatingCartProps) {
  const cartRef = useRef<HTMLDivElement>(null)

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const getItemPrice = (item: CartItem) => {
    return item.customPrice !== undefined ? item.customPrice : Number(item.product.price)
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity
  }, 0)

  const discountAmount = discount > 0 
    ? (discount <= 100 ? subtotal * (discount / 100) : discount) 
    : 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    const item = items.find(i => i.product.id === productId)
    if (item && newQuantity > Number(item.product.stock_quantity)) {
      return
    }
    onUpdateQuantity(productId, newQuantity)
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && cartRef.current && !cartRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside as any)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside as any)
    }
  }, [isExpanded, onToggle])

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        onToggle()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isExpanded, onToggle])

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Floating Cart */}
      <div
        ref={cartRef}
        data-tour-id="cart-container"
        className={cn(
          'fixed z-50 transition-all duration-300 ease-in-out',
          isExpanded 
            ? 'right-0 top-0 h-full w-full sm:w-96 bg-card border-l shadow-2xl' 
            : 'bottom-6 right-6 sm:bottom-8 sm:right-8'
        )}
      >
        {/* Collapsed State - Floating Button */}
        {!isExpanded && (
          <button
            onClick={onToggle}
            data-tour-id="floating-cart-toggle"
            className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-full shadow-2xl hover:scale-110 transition-transform group w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-primary/20"
          >
            <div className="relative">
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8" />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md">
                  {items.length}
                </span>
              )}
            </div>
            {total > 0 && (
              <span className="text-[10px] sm:text-xs font-semibold mt-1 text-center drop-shadow-sm">
                {formatCurrency(total).replace('KSH ', '')}
              </span>
            )}
          </button>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Cart</h2>
                  <span className="text-sm text-muted-foreground">
                    ({items.length} items)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={onClearCart}>
                      Clear
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onToggle}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm mt-1">Add products to get started</p>
                </div>
              ) : (
                items.map((item) => {
                  const itemPrice = getItemPrice(item)
                  const hasCustomPrice = item.customPrice !== undefined
                  
                  return (
                    <div key={item.product.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {/* Price Input */}
                      <div className="space-y-1">
                        <Label className="text-xs">Price per unit</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={itemPrice}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0
                              onUpdatePrice(item.product.id, newPrice)
                            }}
                            className="h-8 text-sm"
                            min={0}
                            step="0.01"
                          />
                          {hasCustomPrice && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onUpdatePrice(item.product.id, Number(item.product.price))}
                              className="text-xs h-8"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                        {hasCustomPrice && (
                          <p className="text-xs text-amber-600 dark:text-amber-500">
                            Original: {formatCurrency(Number(item.product.price))}
                          </p>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              handleQuantityChange(item.product.id, val)
                            }}
                            className="w-16 text-center h-8"
                            min={1}
                            max={Number(item.product.stock_quantity)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= Number(item.product.stock_quantity)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(itemPrice)} × {item.quantity}
                          </div>
                          <div className="font-semibold text-sm">
                            {formatCurrency(itemPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="discount"
                      type="number"
                      value={discount || ''}
                      onChange={(e) => onUpdateDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      onClick={() => onUpdateDiscount(0)}
                      disabled={discount === 0}
                    >
                      Clear
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter percentage (1-100) or fixed amount
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg"
                  onClick={onCheckout}
                  disabled={items.length === 0}
                  data-tour-id="checkout-button"
                >
                  Checkout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
