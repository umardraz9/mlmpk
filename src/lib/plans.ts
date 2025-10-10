// Shared plan utilities for resolving membership plans and providing sensible defaults
import type { PrismaClient } from '@prisma/client'

export type PlanLike = {
  id?: string
  name: string
  displayName: string
  price: number
  dailyTaskEarning: number
  tasksPerDay: number
  maxEarningDays: number
  extendedEarningDays: number
  minimumWithdrawal: number
  voucherAmount: number
  isActive?: boolean
}

export function getDefaultPlans(): PlanLike[] {
  const base = {
    tasksPerDay: 5,
    maxEarningDays: 30,
    extendedEarningDays: 60,
  }
  return [
    {
      name: 'BASIC',
      displayName: 'Basic Plan',
      price: 1000,
      dailyTaskEarning: 50,
      tasksPerDay: base.tasksPerDay,
      maxEarningDays: base.maxEarningDays,
      extendedEarningDays: base.extendedEarningDays,
      minimumWithdrawal: 2000,
      voucherAmount: 500,
      isActive: true,
    },
    {
      name: 'STANDARD',
      displayName: 'Standard Plan',
      price: 3000,
      dailyTaskEarning: 150,
      tasksPerDay: base.tasksPerDay,
      maxEarningDays: base.maxEarningDays,
      extendedEarningDays: base.extendedEarningDays,
      minimumWithdrawal: 4000,
      voucherAmount: 1000,
      isActive: true,
    },
    {
      name: 'PREMIUM',
      displayName: 'Premium Plan',
      price: 8000,
      dailyTaskEarning: 400,
      tasksPerDay: base.tasksPerDay,
      maxEarningDays: base.maxEarningDays,
      extendedEarningDays: base.extendedEarningDays,
      minimumWithdrawal: 10000,
      voucherAmount: 2000,
      isActive: true,
    },
  ]
}

// Try DB lookup first, then fallback to default definitions when DB is empty/missing
export async function resolvePlanByName(prisma: PrismaClient, planName?: string | null): Promise<PlanLike | null> {
  if (!planName) return null
  const normalized = String(planName).toUpperCase()

  // Try database first
  try {
    const plan = await (prisma as any).membershipPlan.findFirst({
      where: {
        OR: [
          { name: normalized },
          { name: planName as string },
        ],
      },
    })
    if (plan) return plan as PlanLike
  } catch (e) {
    // ignore and try defaults
  }

  // Fallback to defaults (useful when DB has no plans yet)
  const defaults = getDefaultPlans()
  const match = defaults.find((p) => p.name === normalized)
  return match || null
}
