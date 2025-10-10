import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CommissionLevel {
  level: number
  rate: number
  description?: string
  isActive: boolean
}

class CommissionService {
  private static instance: CommissionService
  private cachedSettings: CommissionLevel[] | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): CommissionService {
    if (!CommissionService.instance) {
      CommissionService.instance = new CommissionService()
    }
    return CommissionService.instance
  }

  /**
   * Get all commission settings with caching
   */
  async getCommissionSettings(): Promise<CommissionLevel[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.cachedSettings && now < this.cacheExpiry) {
      return this.cachedSettings
    }

    try {
      const settings = await prisma.commissionSettings.findMany({
        orderBy: { level: 'asc' },
        where: { isActive: true }
      })

      // If no settings exist, create and return defaults
      if (settings.length === 0) {
        const defaultSettings = await this.createDefaultSettings()
        this.cachedSettings = defaultSettings
        this.cacheExpiry = now + this.CACHE_DURATION
        return defaultSettings
      }

      const commissionLevels: CommissionLevel[] = settings.map(setting => ({
        level: setting.level,
        rate: setting.rate,
        description: setting.description || undefined,
        isActive: setting.isActive
      }))

      // Cache the results
      this.cachedSettings = commissionLevels
      this.cacheExpiry = now + this.CACHE_DURATION

      return commissionLevels
    } catch (error) {
      console.error('Error fetching commission settings:', error)
      // Return default settings as fallback
      return this.getDefaultSettings()
    }
  }

  /**
   * Get commission rate for a specific level
   */
  async getCommissionRate(level: number): Promise<number> {
    const settings = await this.getCommissionSettings()
    const setting = settings.find(s => s.level === level)
    return setting?.rate || 0
  }

  /**
   * Calculate commission for a specific level and amount
   */
  async calculateCommission(amount: number, level: number): Promise<number> {
    const rate = await this.getCommissionRate(level)
    return Math.round(amount * rate)
  }

  /**
   * Calculate commission for all levels
   */
  async calculateAllLevelCommissions(amount: number): Promise<{ level: number; rate: number; commission: number }[]> {
    const settings = await this.getCommissionSettings()
    return settings.map(setting => ({
      level: setting.level,
      rate: setting.rate,
      commission: Math.round(amount * setting.rate)
    }))
  }

  /**
   * Get total possible commission across all levels
   */
  async getTotalPossibleCommission(amount: number): Promise<number> {
    const settings = await this.getCommissionSettings()
    const totalRate = settings.reduce((sum, setting) => sum + setting.rate, 0)
    return Math.round(amount * totalRate)
  }

  /**
   * Clear cache to force refresh from database
   */
  clearCache(): void {
    this.cachedSettings = null
    this.cacheExpiry = 0
  }

  /**
   * Create default commission settings
   */
  private async createDefaultSettings(): Promise<CommissionLevel[]> {
    const defaultSettings = [
      { level: 1, rate: 0.20, description: 'Level 1 - Direct Referral' },
      { level: 2, rate: 0.15, description: 'Level 2 - Second Level' },
      { level: 3, rate: 0.10, description: 'Level 3 - Third Level' },
      { level: 4, rate: 0.08, description: 'Level 4 - Fourth Level' },
      { level: 5, rate: 0.07, description: 'Level 5 - Fifth Level' },
    ]

    try {
      await Promise.all(
        defaultSettings.map(setting =>
          prisma.commissionSettings.create({
            data: {
              level: setting.level,
              rate: setting.rate,
              description: setting.description,
              isActive: true
            }
          })
        )
      )
    } catch (error) {
      console.error('Error creating default commission settings:', error)
    }

    return defaultSettings.map(setting => ({
      level: setting.level,
      rate: setting.rate,
      description: setting.description,
      isActive: true
    }))
  }

  /**
   * Get default settings without database interaction
   */
  private getDefaultSettings(): CommissionLevel[] {
    return [
      { level: 1, rate: 0.20, description: 'Level 1 - Direct Referral', isActive: true },
      { level: 2, rate: 0.15, description: 'Level 2 - Second Level', isActive: true },
      { level: 3, rate: 0.10, description: 'Level 3 - Third Level', isActive: true },
      { level: 4, rate: 0.08, description: 'Level 4 - Fourth Level', isActive: true },
      { level: 5, rate: 0.07, description: 'Level 5 - Fifth Level', isActive: true },
    ]
  }

  /**
   * Format commission rate as percentage string
   */
  formatRateAsPercentage(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`
  }

  /**
   * Get commission levels formatted for display
   */
  async getFormattedCommissionLevels(): Promise<Array<{
    level: number
    rate: string
    amount: number
    description?: string
  }>> {
    const settings = await this.getCommissionSettings()
    const baseAmount = 1000 // PKR 1000 base investment
    
    return settings.map(setting => ({
      level: setting.level,
      rate: this.formatRateAsPercentage(setting.rate),
      amount: Math.round(baseAmount * setting.rate),
      description: setting.description
    }))
  }
}

// Export singleton instance
export const commissionService = CommissionService.getInstance()

// Legacy compatibility functions for existing code
export async function calculateCommission(amount: number, level: number): Promise<number> {
  return await commissionService.calculateCommission(amount, level)
}

export async function getCommissionLevels(): Promise<Array<{ level: number; rate: number; amount: number }>> {
  const settings = await commissionService.getCommissionSettings()
  const baseAmount = 1000 // PKR 1000 base investment
  
  return settings.map(setting => ({
    level: setting.level,
    rate: setting.rate,
    amount: Math.round(baseAmount * setting.rate)
  }))
}

export async function getTotalPossibleCommission(): Promise<number> {
  return await commissionService.getTotalPossibleCommission(1000)
}
