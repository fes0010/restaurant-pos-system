'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CartItem } from './Cart'
import { Customer } from '@/types'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  customer: Customer | null
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
  onSuccess,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank' | 'debt'>('cash')
  const [amountTendered, setAmountTendered] = useState<number>(total)
  const createTransaction = useCreateTransaction()

  const change = paymentMethod === 'cash' ? Math.max(0, amountTendered - total) : 0
  const isValidPayment = paymentMethod !== 'cash' || amountTendered >= total

  const formatCurrency = (value: number) => {
    return `KES ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCheckout = async () => {
    if (!isValidPayment) {
      toast.error('Amount tendered must be greater than or equal to total')
      return
    }

    try {
      const discountAmount = discount > 0 ? (discount <= 100 ? subtotal * (discount / 100) : discount) : 0
      
      const transaction = await createTransaction.mutateAsync({
        customer_id: customer?.id,
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
        amount_tendered: paymentMethod === 'cash' ? amountTendered : undefined,
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

          {/* Cash Payment Fields */}
          {paymentMethod === 'cash' && (
            <>
              <div>
                <Label htmlFor="amount-tendered">Amount Tendered *</Label>
                <Input
                  id="amount-tendered"
                  type="number"
                  step="0.01"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(Number(e.target.value) || 0)}
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
                    Insufficient amount tendered
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
              disabled={!isValidPayment || createTransaction.isPending}
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
