'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CartItem } from './Cart'
import { Customer } from '@/types'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useCustomerCreditStatus, useCustomers } from '@/hooks/useCustomers'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Loader2, Search, X, User } from 'lucide-react'

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  customer: Customer | null
  onCustomerChange?: (customer: Customer | null) => void
  onSuccess: (transactionId: string) => void
}

export function CheckoutModal({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  total,
  customer,
  onCustomerChange,
  onSuccess,
}: CheckoutModalProps) {
  const { user } = useAuth()
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank' | 'debt'>('cash')
  const [amountReceived, setAmountReceived] = useState<number>(total)
  const createTransaction = useCreateTransaction()
  
  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Fetch customers for search
  const { data: customersData, isLoading: customersLoading } = useCustomers({ 
    search: customerSearch, 
    pageSize: 10 
  })

  // Fetch real-time credit status when customer is selected
  const { data: creditStatus, isLoading: creditLoading } = useCustomerCreditStatus(customer?.id || '')
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelectCustomer = (selectedCustomer: Customer) => {
    onCustomerChange?.(selectedCustomer)
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }
  
  const handleClearCustomer = () => {
    onCustomerChange?.(null)
    setCustomerSearch('')
  }
  
  const change = paymentMethod === 'cash' ? Math.max(0, amountReceived - total) : 0
  const isValidPayment = paymentMethod !== 'cash' || amountReceived >= total
  const requiresCustomer = paymentMethod === 'debt'
  const hasRequiredCustomer = !requiresCustomer || customer !== null
  
  // Credit validation for debt payments
  const isCustomerCreditApproved = creditStatus?.customer?.is_credit_approved || false
  const availableCredit = creditStatus?.available_credit || 0
  const outstandingDebt = creditStatus?.outstanding_debt || 0
  const creditLimit = creditStatus?.customer?.credit_limit || 0
  const canAffordDebt = paymentMethod !== 'debt' || (isCustomerCreditApproved && availableCredit >= total)

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCheckout = async () => {
    if (!isValidPayment) {
      toast.error('Amount received must be greater than or equal to total')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    if (paymentMethod === 'debt' && !customer) {
      toast.error('A customer must be selected for debt payments')
      return
    }

    if (paymentMethod === 'debt' && customer && !isCustomerCreditApproved) {
      toast.error('Customer is not approved for credit purchases')
      return
    }

    if (paymentMethod === 'debt' && customer && availableCredit < total) {
      toast.error(`Insufficient credit limit. Available: ${formatCurrency(availableCredit)}`)
      return
    }

    try {
      const discountAmount = discount > 0 ? (discount <= 100 ? subtotal * (discount / 100) : discount) : 0
      
      const transaction = await createTransaction.mutateAsync({
        customer_id: customer?.id,
        served_by: user.id,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.customPrice !== undefined ? item.customPrice : Number(item.product.price),
        })),
        subtotal,
        discount_type: discount > 0 && discount <= 100 ? 'percentage' : 'fixed',
        discount_value: discount,
        discount_amount: discountAmount,
        total,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'cash' ? amountReceived : undefined,
      })

      toast.success('Transaction completed successfully')
      onSuccess(transaction.id)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete transaction')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-500">
                <span>Discount</span>
                <span>-{formatCurrency(discount <= 100 ? subtotal * (discount / 100) : discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Info */}
          {customer && (
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium mb-1">Customer</div>
              <div className="text-sm text-muted-foreground">{customer.name}</div>
              {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
            </div>
          )}

          {/* Served By */}
          <div>
            <Label htmlFor="served-by">Served By</Label>
            <Input
              id="served-by"
              value={user?.full_name || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger id="payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="debt">Debt (Pay Later)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debt Payment Info */}
          {paymentMethod === 'debt' && (
            <>
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer for Debt *</Label>
                {customer ? (
                  <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearCustomer}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative" ref={searchInputRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers by name or phone..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerDropdown(true)
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="pl-9"
                    />
                    {showCustomerDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {customersLoading ? (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Searching...
                          </div>
                        ) : customersData?.customers && customersData.customers.length > 0 ? (
                          customersData.customers.map((c) => (
                            <button
                              key={c.id}
                              className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 border-b last:border-0"
                              onClick={() => handleSelectCustomer(c)}
                            >
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{c.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.phone || c.email || 'No contact'}
                                  {c.is_credit_approved && (
                                    <span className="ml-2 text-green-600">• Credit Approved</span>
                                  )}
                                </p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            {customerSearch ? 'No customers found' : 'Type to search customers'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Credit Information */}
              {customer && (
                creditLoading ? (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading credit information...</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Credit Information</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit Approved</span>
                        <span className={isCustomerCreditApproved ? 'text-green-600' : 'text-red-600'}>
                          {isCustomerCreditApproved ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {isCustomerCreditApproved && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Credit Limit</span>
                            <span>{formatCurrency(creditLimit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Outstanding Debt</span>
                            <span className="text-orange-600">{formatCurrency(outstandingDebt)}</span>
                          </div>
                          <div className="flex justify-between font-medium pt-1 border-t">
                            <span>Available Credit</span>
                            <span className={availableCredit >= total ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(availableCredit)}
                            </span>
                          </div>
                          {availableCredit >= total && (
                            <div className="flex justify-between text-xs pt-1">
                              <span className="text-muted-foreground">After this sale</span>
                              <span className="text-muted-foreground">{formatCurrency(availableCredit - total)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {!isCustomerCreditApproved && (
                      <p className="text-xs text-red-500 mt-2">
                        This customer is not approved for credit. Please approve them in the Customers page first.
                      </p>
                    )}
                    {isCustomerCreditApproved && availableCredit < total && (
                      <p className="text-xs text-red-500 mt-2">
                        This sale exceeds the customer's available credit limit.
                      </p>
                    )}
                  </div>
                )
              )}
            </>
          )}

          {/* Cash Payment Fields */}
          {paymentMethod === 'cash' && (
            <>
              <div>
                <Label htmlFor="amount-received">Amount Received *</Label>
                <Input
                  id="amount-received"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value) || 0)}
                  min={0}
                />
              </div>

              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Change</span>
                  <span className={`text-lg font-bold ${change < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(change)}
                  </span>
                </div>
                {change < 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Insufficient amount received
                  </p>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={createTransaction.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              disabled={!isValidPayment || !hasRequiredCustomer || !canAffordDebt || createTransaction.isPending}
            >
              {createTransaction.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Sale'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
