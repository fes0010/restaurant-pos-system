'use client'

import { Card } from '@/components/ui/card'
import { useExpenseSummary } from '@/hooks/useExpenses'
import { useAuth } from '@/contexts/AuthContext'

interface ExpenseSummaryProps {
  dateFrom?: string
  dateTo?: string
}

function formatCurrency(amount: number) {
  return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function ExpenseSummary({ dateFrom, dateTo }: ExpenseSummaryProps) {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  
  const { data: summary, isLoading } = useExpenseSummary({ dateFrom, dateTo })

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-red-500',
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Expense Summary</h3>
        {!isLoading && (
          <span className="text-2xl font-bold">
            {formatCurrency(summary?.total || 0)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : summary && summary.by_category.length > 0 ? (
        <div className="space-y-3">
          {summary.by_category.map((item, index) => {
            const percentage = summary.total > 0 
              ? (item.amount / summary.total) * 100 
              : 0
            const color = colors[index % colors.length]
            
            return (
              <div key={item.category.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.category.name}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% of total
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No expenses recorded for this period
        </p>
      )}
    </Card>
  )
}

export function ExpenseKPICards() {
  const { tenant } = useAuth()
  const currency = tenant?.settings?.currency || 'KES'
  
  // Get current month summary
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const { data: monthSummary, isLoading } = useExpenseSummary({
    dateFrom: startOfMonth.toISOString().split('T')[0],
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          This Month
        </h3>
        {isLoading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(monthSummary?.total || 0)}
          </p>
        )}
      </Card>
      
      <Card className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Categories
        </h3>
        {isLoading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-2xl font-bold">
            {monthSummary?.by_category.length || 0}
          </p>
        )}
      </Card>
    </div>
  )
}
