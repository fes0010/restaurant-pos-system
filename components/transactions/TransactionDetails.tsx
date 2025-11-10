'use client'

import { Transaction } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SemanticBadge } from '@/components/ui/semantic-badge'
import { MonetaryValue } from '@/components/ui/value-display'
import { format } from 'date-fns'
import { Printer, RotateCcw } from 'lucide-react'
import { ReceiptPrint } from '@/components/pos/ReceiptPrint'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useState } from 'react'
import { useTransaction } from '@/hooks/useTransactions'
import { useRouter } from 'next/navigation'

interface TransactionDetailsProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetails({ transaction, open, onOpenChange }: TransactionDetailsProps) {
  const [showReceipt, setShowReceipt] = useState(false)
  const router = useRouter()
  
  // Fetch full transaction details with items
  const { data: fullTransaction, isLoading } = useTransaction(transaction.id)

  const formatCurrency = (value: number | string) => {
    return `KSH ${Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handlePrintReceipt = () => {
    setShowReceipt(true)
    setTimeout(() => {
      window.print()
      setShowReceipt(false)
    }, 500)
  }

  const handleCreateReturn = () => {
    // Navigate to returns page with transaction ID
    router.push(`/returns?transaction_id=${transaction.id}`)
    onOpenChange(false)
  }

  if (showReceipt) {
    return <ReceiptPrint transactionId={transaction.id} />
  }

  // Use fullTransaction if available, otherwise use the passed transaction
  const displayTransaction = fullTransaction || transaction

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Transaction #</div>
                <div className="font-mono font-medium">{displayTransaction.transaction_number}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Date</div>
                <div className="font-medium">
                  {format(new Date(displayTransaction.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Customer</div>
                <div className="font-medium">{displayTransaction.customer?.name || 'Walk-in'}</div>
                {displayTransaction.customer?.phone && (
                  <div className="text-sm text-muted-foreground">{displayTransaction.customer.phone}</div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Payment Method</div>
                <div className="font-medium capitalize">{displayTransaction.payment_method}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created By</div>
                <div className="font-medium">{displayTransaction.created_by_user?.full_name || 'N/A'}</div>
                <div className="text-xs text-muted-foreground capitalize">{displayTransaction.created_by_user?.role}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <SemanticBadge variant={displayTransaction.status === 'completed' ? 'success' : 'pending'}>
                  {displayTransaction.status.replace('_', ' ')}
                </SemanticBadge>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              {!displayTransaction.items || displayTransaction.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No items found
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Product</th>
                        <th className="text-center p-3 text-sm font-medium">Qty</th>
                        <th className="text-right p-3 text-sm font-medium">Price</th>
                        <th className="text-right p-3 text-sm font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayTransaction.items.map((item: any) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-muted-foreground">{item.product_sku}</div>
                          </td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">{formatCurrency(item.unit_price)}</td>
                          <td className="text-right p-3 font-medium">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <MonetaryValue value={Number(displayTransaction.subtotal)} type="neutral" />
              </div>
              {displayTransaction.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount ({displayTransaction.discount_type === 'percentage' ? `${displayTransaction.discount_value}%` : 'Fixed'})
                  </span>
                  <MonetaryValue value={-Number(displayTransaction.discount_amount)} type="profit" showSign />
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <MonetaryValue value={Number(displayTransaction.total)} type="revenue" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handlePrintReceipt} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCreateReturn}
                disabled={!displayTransaction.items || displayTransaction.items.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Create Return
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
