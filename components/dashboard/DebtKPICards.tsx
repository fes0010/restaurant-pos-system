'use client'

import Link from 'next/link'
import { CreditCard, AlertTriangle, Banknote } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useDebtSummary } from '@/hooks/useDebts'
import { useAuth } from '@/contexts/AuthContext'

function formatCurrency(amount: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function DebtKPICards() {
  const { tenant } = useAuth()
  const { data: summary, isLoading } = useDebtSummary()
  const currency = tenant?.settings?.currency || 'KES'

  // Count overdue customers (debts older than 30 days)
  const overdueAmount = (summary?.aging?.overdue_30 || 0) + 
                        (summary?.aging?.overdue_60 || 0) + 
                        (summary?.aging?.overdue_90 || 0)

  const cards = [
    {
      title: 'Total Outstanding Debt',
      value: formatCurrency(summary?.total_outstanding || 0, currency),
      icon: CreditCard,
      color: 'text-orange-500',
      href: '/debts',
    },
    {
      title: 'Overdue (30+ days)',
      value: formatCurrency(overdueAmount, currency),
      icon: AlertTriangle,
      color: 'text-red-500',
      href: '/debts?filter=overdue',
    },
    {
      title: 'Collected Today',
      value: formatCurrency(summary?.collected_today || 0, currency),
      icon: Banknote,
      color: 'text-green-500',
      href: '/debts',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.title} href={card.href}>
          <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">{card.title}</h3>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            
            {isLoading ? (
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-bold">{card.value}</p>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
}
