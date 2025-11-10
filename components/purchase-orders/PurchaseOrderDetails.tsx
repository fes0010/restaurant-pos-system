'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SemanticBadge } from '@/components/ui/semantic-badge'
import { MonetaryValue } from '@/components/ui/value-display'
import { useUpdatePurchaseOrderStatus, useRestockFromPurchaseOrder } from '@/hooks/usePurchaseOrders'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { ArrowRight, Package } from 'lucide-react'

interface PurchaseOrderDetailsProps {
  po: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PurchaseOrderDetails({ po, open, onOpenChange }: PurchaseOrderDetailsProps) {
  const updateStatus = useUpdatePurchaseOrderStatus()
  const restock = useRestockFromPurchaseOrder()

  const formatCurrency = (value: number) => {
    return `KSH ${value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleStatusChange = async (newStatus: any) => {
    try {
      await updateStatus.mutateAsync({ id: po.id, status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  const handleRestock = async () => {
    if (!confirm('This will add all items to inventory. Continue?')) return
    
    try {
      await restock.mutateAsync(po.id)
      toast.success('Inventory restocked successfully')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to restock inventory')
    }
  }

  const getNextStatus = () => {
    switch (po.status) {
      case 'draft': return 'ordered'
      case 'ordered': return 'received'
      case 'received': return 'completed'
      default: return null
    }
  }

  const nextStatus = getNextStatus()

  const getStatusVariant = (status: string): 'success' | 'pending' | 'info' | 'inactive' => {
    switch (status) {
      case 'completed': return 'success'
      case 'received': return 'pending'
      case 'ordered': return 'info'
      default: return 'inactive'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">PO Number</div>
              <div className="font-mono font-medium">{po.po_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <SemanticBadge variant={getStatusVariant(po.status)}>{po.status}</SemanticBadge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Supplier</div>
              <div className="font-medium">{po.supplier_name}</div>
              {po.supplier_contact && <div className="text-sm text-muted-foreground">{po.supplier_contact}</div>}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Expected Delivery</div>
              <div className="font-medium">{format(new Date(po.expected_delivery_date), 'MMM dd, yyyy')}</div>
            </div>
          </div>

          {po.notes && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Notes</div>
              <div>{po.notes}</div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Product</th>
                    <th className="text-center p-3 text-sm font-medium">Quantity</th>
                    <th className="text-right p-3 text-sm font-medium">Cost/Unit</th>
                    <th className="text-right p-3 text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items?.map((item: any) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 font-medium">{item.product_name}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">
                        <MonetaryValue value={Number(item.cost_per_unit)} type="cost" />
                      </td>
                      <td className="text-right p-3">
                        <MonetaryValue value={Number(item.total_cost)} type="cost" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <span className="text-lg font-semibold">Total Cost</span>
            <MonetaryValue value={Number(po.total_cost)} type="cost" className="text-2xl" />
          </div>

          <div className="flex gap-2">
            {nextStatus && (
              <Button onClick={() => handleStatusChange(nextStatus)} disabled={updateStatus.isPending} className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Mark as {nextStatus}
              </Button>
            )}
            {po.status === 'received' && (
              <Button onClick={handleRestock} disabled={restock.isPending} variant="outline" className="flex-1">
                <Package className="h-4 w-4 mr-2" />
                Restock Inventory
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
