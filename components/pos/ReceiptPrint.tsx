'use client'

import { useEffect } from 'react'
import { useTransaction } from '@/hooks/useTransactions'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ReceiptPrintProps {
  transactionId: string
  autoPrint?: boolean
}

export function ReceiptPrint({ transactionId, autoPrint = false }: ReceiptPrintProps) {
  const { data: transaction, isLoading } = useTransaction(transactionId)
  const { tenant } = useAuth()

  useEffect(() => {
    if (autoPrint && transaction && !isLoading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [autoPrint, transaction, isLoading])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!transaction) {
    return <div className="text-center py-12 text-muted-foreground">Transaction not found</div>
  }

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="max-w-sm mx-auto p-6 font-mono text-sm">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold mb-2">{tenant?.name || 'Smart POS'}</h1>
        <div className="text-xs text-muted-foreground">
          <div>SALES RECEIPT</div>
          <div className="mt-2">{format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}</div>
        </div>
      </div>

      <div className="border-t border-b border-dashed py-2 mb-4">
        <div className="flex justify-between text-xs">
          <span>Receipt #:</span>
          <span className="font-semibold">{transaction.transaction_number}</span>
        </div>
        {transaction.customer && (
          <div className="flex justify-between text-xs mt-1">
            <span>Customer:</span>
            <span>{transaction.customer.name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items?.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  <div className="font-medium">{item.product_name}</div>
                  <div className="text-muted-foreground">{item.product_sku}</div>
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.unit_price)}</td>
                <td className="text-right font-medium">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-xs">
          <span>Subtotal:</span>
          <span>{formatCurrency(transaction.subtotal)}</span>
        </div>
        {transaction.discount_amount > 0 && (
          <div className="flex justify-between text-xs">
            <span>
              Discount ({transaction.discount_type === 'percentage' ? `${transaction.discount_value}%` : 'Fixed'}):
            </span>
            <span>-{formatCurrency(transaction.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t pt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(transaction.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-dashed pt-4 mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Payment Method:</span>
          <span className="font-medium uppercase">{transaction.payment_method}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Status:</span>
          <span className="font-medium uppercase">{transaction.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground border-t border-dashed pt-4">
        <div className="mb-2">Thank you for your business!</div>
        <div>Please come again</div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .max-w-sm,
          .max-w-sm * {
            visibility: visible;
          }
          .max-w-sm {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
