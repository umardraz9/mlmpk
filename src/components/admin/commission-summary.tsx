'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, Settings } from 'lucide-react'

interface CommissionRate {
  level: number
  rate: number
  description?: string
  isActive: boolean
}

interface CommissionSummaryProps {
  commissionRates: CommissionRate[]
  totalCommissionRate: number
  platformRevenue: number
}

export function CommissionSummary({ commissionRates, totalCommissionRate, platformRevenue }: CommissionSummaryProps) {
  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(1)}%`
  const formatCurrency = (amount: number) => `PKR ${amount.toFixed(0)}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            MCNmart.com Partnership Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{commissionRates.length}</div>
          <p className="text-xs text-muted-foreground">
            {commissionRates.filter(r => r.isActive).length} active partnership levels
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Total Social Sales Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(totalCommissionRate)}</div>
          <p className="text-xs text-muted-foreground">
            Of PKR 1,000 partnership enrollment
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            MCNmart.com Platform Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(platformRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            After social sales income: {formatCurrency(1000 * platformRevenue)}
          </p>
        </CardContent>
      </Card>

      {commissionRates.length > 0 && (
        <div className="col-span-full">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {commissionRates.map((rate) => (
              <div key={rate.level} className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Level {rate.level}</span>
                  <Badge variant={rate.isActive ? "default" : "secondary"} className="text-xs">
                    {rate.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-lg font-semibold">{formatPercentage(rate.rate)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(1000 * rate.rate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
