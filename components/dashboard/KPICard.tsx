import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string
  change?: number
  icon: LucideIcon
  loading?: boolean
  valueType?: 'revenue' | 'profit' | 'cost' | 'neutral'
}

export function KPICard({ title, value, change, icon: Icon, loading, valueType = 'neutral' }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0

  const valueColorClasses = {
    revenue: 'text-revenue',
    profit: 'text-profit',
    cost: 'text-cost',
    neutral: 'text-foreground',
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      ) : (
        <>
          <p className={cn('text-2xl font-bold mb-2', valueColorClasses[valueType])}>
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-profit" />
              ) : (
                <TrendingDown className="h-3 w-3 text-loss" />
              )}
              <span className={isPositive ? 'text-profit' : 'text-loss'}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">from last period</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
