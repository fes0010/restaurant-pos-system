'use client'

import { useState } from 'react'
import { useReturns } from '@/hooks/useReturns'
import { Return } from '@/lib/services/returns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CreateReturnModal } from './CreateReturnModal'
import { ReturnDetailsModal } from './ReturnDetailsModal'
import { format } from 'date-fns'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react'

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
}

export function ReturnsList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)

  const { data: returnsData, isLoading } = useReturns({
    search: search || undefined,
    status: status || undefined,
    page,
    pageSize: 20,
  })

  const openReturnDetails = (returnItem: Return) => {
    setSelectedReturn(returnItem)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Returns Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage product returns and refunds
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Return
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by return number or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Returns List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : returnsData?.returns.length ? (
        <>
          <div className="space-y-3">
            {returnsData.returns.map((returnItem) => {
              const statusInfo = statusConfig[returnItem.status as keyof typeof statusConfig]
              const StatusIcon = statusInfo.icon

              return (
                <Card
                  key={returnItem.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openReturnDetails(returnItem)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{returnItem.return_number}</h3>
                        <Badge className={statusInfo.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Transaction</p>
                          <p className="font-medium">
                            {returnItem.transaction?.transaction_number}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Customer</p>
                          <p className="font-medium">
                            {returnItem.transaction?.customer?.name || 'Walk-in'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">${returnItem.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(new Date(returnItem.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Reason:</span> {returnItem.reason}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created by: {returnItem.created_by_user?.full_name}</span>
                        {returnItem.approved_by_user && (
                          <span>
                            {returnItem.status === 'approved' ? 'Approved' : 'Rejected'} by:{' '}
                            {returnItem.approved_by_user.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {returnsData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, returnsData.total)} of{' '}
                {returnsData.total} returns
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {returnsData.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(returnsData.totalPages, p + 1))}
                  disabled={page === returnsData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No returns found</h3>
          <p className="text-muted-foreground mb-4">
            {search || status ? 'Try adjusting your filters' : 'No returns have been created yet'}
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Return
          </Button>
        </Card>
      )}

      {/* Modals */}
      <CreateReturnModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      <ReturnDetailsModal
        returnItem={selectedReturn}
        open={!!selectedReturn}
        onOpenChange={(open) => {
          if (!open) setSelectedReturn(null)
        }}
      />
    </div>
  )
}
