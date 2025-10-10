'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'

interface CommissionSetting {
  id?: string
  level: number
  rate: number
  description?: string
  isActive: boolean
  updatedByUser?: {
    name: string
    email: string
  }
  updatedAt?: string
}

export default function CommissionSettingsPage() {
  const [settings, setSettings] = useState<CommissionSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/commission-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        throw new Error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error)
      setMessage({ type: 'error', text: 'Failed to load commission settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleRateChange = (level: number, newRate: string) => {
    const rate = parseFloat(newRate) / 100 // Convert percentage to decimal
    if (isNaN(rate) || rate < 0 || rate > 1) return

    setSettings(prev => prev.map(setting => 
      setting.level === level 
        ? { ...setting, rate: rate }
        : setting
    ))
    setHasChanges(true)
  }

  const handleDescriptionChange = (level: number, description: string) => {
    setSettings(prev => prev.map(setting => 
      setting.level === level 
        ? { ...setting, description }
        : setting
    ))
    setHasChanges(true)
  }

  const handleActiveToggle = (level: number) => {
    setSettings(prev => prev.map(setting => 
      setting.level === level 
        ? { ...setting, isActive: !setting.isActive }
        : setting
    ))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/commission-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        setHasChanges(false)
        setMessage({ type: 'success', text: 'Commission settings updated successfully!' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving commission settings:', error)
      setMessage({ type: 'error', text: 'Failed to save commission settings' })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset to default commission rates? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/admin/commission-settings', {
        method: 'POST',
      })

      if (response.ok) {
        const defaultSettings = await response.json()
        setSettings(defaultSettings)
        setHasChanges(false)
        setMessage({ type: 'success', text: 'Commission settings reset to defaults!' })
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting commission settings:', error)
      setMessage({ type: 'error', text: 'Failed to reset commission settings' })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateCommissionAmount = (rate: number) => {
    const baseAmount = 1000 // PKR 1000 base investment
    return Math.round(baseAmount * rate)
  }

  const getTotalCommissionRate = () => {
    return settings
      .filter(s => s.isActive)
      .reduce((total, setting) => total + setting.rate, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commission Settings</h1>
            <p className="text-gray-600">Configure MLM commission rates and structure</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Settings</h1>
          <p className="text-gray-600">Configure MLM commission rates and structure</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving || !hasChanges}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <Card className={`border-l-4 ${
          message.type === 'success' ? 'border-green-500 bg-green-50' :
          message.type === 'error' ? 'border-red-500 bg-red-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {message.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              <span className={`font-medium ${
                message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(getTotalCommissionRate() * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(Math.round(1000 * getTotalCommissionRate()))} per PKR 1,000 investment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Levels</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              Out of {settings.length} total levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Share</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((1 - getTotalCommissionRate()) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(Math.round(1000 * (1 - getTotalCommissionRate())))} per PKR 1,000 investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <Card key={setting.level} className={`${!setting.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>Level {setting.level}</span>
                  <Badge variant={setting.isActive ? "default" : "secondary"}>
                    {setting.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleActiveToggle(setting.level)}
                  className={setting.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                >
                  {setting.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`rate-${setting.level}`}>Commission Rate (%)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id={`rate-${setting.level}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(setting.rate * 100).toFixed(1)}
                    onChange={(e) => handleRateChange(setting.level, e.target.value)}
                    className="flex-1"
                    disabled={!setting.isActive}
                  />
                  <div className="text-sm text-gray-600 min-w-[80px]">
                    {formatCurrency(calculateCommissionAmount(setting.rate))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor={`desc-${setting.level}`}>Description</Label>
                <Input
                  id={`desc-${setting.level}`}
                  type="text"
                  value={setting.description || ''}
                  onChange={(e) => handleDescriptionChange(setting.level, e.target.value)}
                  placeholder={`Level ${setting.level} description`}
                  className="mt-1"
                  disabled={!setting.isActive}
                />
              </div>

              {setting.updatedByUser && (
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Last updated by {setting.updatedByUser.name || setting.updatedByUser.email}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="w-5 h-5" />
            <span>MCNmart.com Partnership Program</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Partnership income rates are applied to the PKR 1,000 social sales program enrollment</li>
            <li>• Changes will take effect immediately for new partnership enrollments</li>
            <li>• Existing partnership income will not be affected by rate changes</li>
            <li>• Total partnership income rate should typically not exceed 60% for platform sustainability</li>
            <li>• Inactive levels will not generate partnership income for participants</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
