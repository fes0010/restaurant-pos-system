'use client'

import { useState, useEffect, useRef } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProductCardGrid } from '@/components/pos/ProductCardGrid'
import { FloatingCart, CartItem } from '@/components/pos/FloatingCart'
import { CustomerSelector } from '@/components/pos/CustomerSelector'
import { CheckoutModal } from '@/components/pos/CheckoutModal'
import { ReceiptPrint } from '@/components/pos/ReceiptPrint'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Product, Customer } from '@/types'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { createImmediateSale } from '@/lib/services/transactions'
import { TourHelpButton } from '@/components/tour/TourHelpButton'

const CART_STORAGE_KEY = 'pos-cart'
const DISCOUNT_STORAGE_KEY = 'pos-discount'
const CUSTOMER_STORAGE_KEY = 'pos-customer'

export default function POSPage() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    const savedDiscount = localStorage.getItem(DISCOUNT_STORAGE_KEY)
    const savedCustomer = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Failed to load cart from localStorage', error)
      }
    }
    
    if (savedDiscount) {
      setDiscount(Number(savedDiscount))
    }

    if (savedCustomer) {
      try {
        setSelectedCustomer(JSON.parse(savedCustomer))
      } catch (error) {
        console.error('Failed to load customer from localStorage', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  // Save discount to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(DISCOUNT_STORAGE_KEY, discount.toString())
  }, [discount])

  // Save customer to localStorage whenever it changes
  useEffect(() => {
    if (selectedCustomer) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(selectedCustomer))
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY)
    }
  }, [selectedCustomer])

  const handleAddToCart = (product: Product) => {
    if (Number(product.stock_quantity) <= 0) {
      toast.error('Product is out of stock')
      return
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)
      
      if (existingItem) {
        // Check if we can add more
        if (existingItem.quantity >= Number(product.stock_quantity)) {
          toast.error('Cannot add more items than available in stock')
          return prev
        }
        // Increment quantity
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        // Add new item
        return [...prev, { product, quantity: 1 }]
      }
    })

    // Show cart briefly and auto-collapse after 2 seconds
    setIsCartExpanded(true)
    toast.success(`${product.name} added to cart`)
    
    // Clear existing timer
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
    }
    
    // Set new timer to auto-collapse
    autoCollapseTimerRef.current = setTimeout(() => {
      setIsCartExpanded(false)
    }, 2000)
  }

  const handleImmediateSale = async (product: Product, customPrice: number) => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      const transaction = await createImmediateSale(
        user.tenant_id,
        user.id,
        product.id,
        product.name,
        product.sku,
        customPrice,
        selectedCustomer?.id
      )

      toast.success(`Sale completed: ${product.name} - KES ${customPrice.toFixed(2)}`)
      
      // Show receipt
      setCompletedTransactionId(transaction.id)
      setIsReceiptOpen(true)
    } catch (error: any) {
      console.error('Immediate sale error:', error)
      toast.error(error.message || 'Failed to complete sale')
      throw error // Re-throw to let ProductCard handle it
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current)
      }
    }
  }, [])

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleUpdatePrice = (productId: string, price: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, customPrice: price } : item
      )
    )
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      setCartItems([])
      setDiscount(0)
      setSelectedCustomer(null)
    }
  }

  const handleCheckout = () => {
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = (transactionId: string) => {
    setCompletedTransactionId(transactionId)
    setIsReceiptOpen(true)
    // Clear cart
    setCartItems([])
    setDiscount(0)
    setSelectedCustomer(null)
  }

  const getItemPrice = (item: CartItem) => {
    return item.customPrice !== undefined ? item.customPrice : Number(item.product.price)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  const discountAmount = discount > 0 ? (discount <= 100 ? subtotal * (discount / 100) : discount) : 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleToggleCart = () => {
    setIsCartExpanded((prev) => !prev)
    // Clear auto-collapse timer when manually toggling
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-[calc(100vh-4rem)] pos-container" data-tour-id="pos-container">
          <div className="bg-card border rounded-lg p-4 sm:p-6 h-full flex flex-col">
            <div className="mb-3 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold">Point of Sale</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Browse and add products to cart
              </p>
            </div>
            
            <div className="mb-3 sm:mb-4" data-tour-id="customer-selector">
              <CustomerSelector
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
              />
            </div>

            <div className="flex-1 overflow-hidden" data-tour-id="product-grid">
              <ProductCardGrid 
                onAddToCart={handleAddToCart}
                onImmediateSale={handleImmediateSale}
              />
            </div>
          </div>
        </div>

        {/* Tour Help Button */}
        <TourHelpButton pageId="pos" />

        {/* Floating Cart */}
        <FloatingCart
          items={cartItems}
          discount={discount}
          isExpanded={isCartExpanded}
          onToggle={handleToggleCart}
          onUpdateQuantity={handleUpdateQuantity}
          onUpdatePrice={handleUpdatePrice}
          onRemoveItem={handleRemoveItem}
          onUpdateDiscount={setDiscount}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          items={cartItems}
          subtotal={subtotal}
          discount={discount}
          total={total}
          customer={selectedCustomer}
          onSuccess={handleCheckoutSuccess}
        />

        {/* Receipt Modal */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
          <DialogContent className="max-w-lg">
            {completedTransactionId && (
              <>
                <ReceiptPrint transactionId={completedTransactionId} />
                <div className="flex justify-center gap-2 mt-4">
                  <Button onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button variant="outline" onClick={() => setIsReceiptOpen(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}
