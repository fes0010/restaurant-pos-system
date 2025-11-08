import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: string
  change?: number
  icon: LucideIcon
  loading?: boolean
}

export function KPICard({ title, value, change, icon: Icon, loading }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0

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
          <p className="text-2xl font-bold mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
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
