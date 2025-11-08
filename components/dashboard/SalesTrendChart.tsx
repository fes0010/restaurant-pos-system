'use client'

import { Card } from '@/components/ui/card'
import { useSalesTrend } from '@/hooks/useDashboard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export function SalesTrendChart() {
  const { data: salesData, isLoading } = useSalesTrend(30)

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    )
  }

  const chartData = salesData?.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue,
    sales: item.sales,
  })) || []

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Sales Trend (Last 30 Days)</h2>
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No sales data available
          </div>
        )}
      </div>
    </Card>
  )
}
