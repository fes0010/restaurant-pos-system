'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { Cart, CartItem } from '@/components/pos/Cart'
import { CustomerSelector } from '@/components/pos/CustomerSelector'
import { CheckoutModal } from '@/components/pos/CheckoutModal'
import { ReceiptPrint } from '@/components/pos/ReceiptPrint'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Product, Customer } from '@/types'
import { Printer } from 'lucide-react'

const CART_STORAGE_KEY = 'pos-cart'
const DISCOUNT_STORAGE_KEY = 'pos-discount'
const CUSTOMER_STORAGE_KEY = 'pos-customer'

export default function POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [completedTransactionId, setCompletedTransactionId] = useState<string | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

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
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)
      
      if (existingItem) {
        // Check if we can add more
        if (existingItem.quantity >= Number(product.stock_quantity)) {
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
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
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

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
  const discountAmount = discount > 0 ? (discount <= 100 ? subtotal * (discount / 100) : discount) : 0
  const total = Math.max(0, subtotal - discountAmount)

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-[calc(100vh-4rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Product Search - Left Side */}
            <div className="lg:col-span-2 overflow-hidden">
              <div className="bg-card border rounded-lg p-6 h-full flex flex-col">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold">Point of Sale</h1>
                  <p className="text-muted-foreground mt-1">
                    Search and add products to cart
                  </p>
                </div>
                
                <div className="mb-4">
                  <CustomerSelector
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                  />
                </div>

                <div className="flex-1 overflow-hidden">
                  <ProductSearch onAddToCart={handleAddToCart} />
                </div>
              </div>
            </div>

            {/* Cart - Right Side */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-lg h-full">
                <Cart
                  items={cartItems}
                  discount={discount}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onUpdateDiscount={setDiscount}
                  onClearCart={handleClearCart}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          </div>
        </div>

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
