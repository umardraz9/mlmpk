'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Settings, 
  Save, 
  RefreshCw,
  MapPin,
  Users,
  Ban,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CountrySettings {
  blockedCountries: string[]
  isEnabled: boolean
  customMessage: string
  allowVpnBypass: boolean
  logAttempts: boolean
}

interface CountryStats {
  country: string
  countryName: string
  blockedAttempts: number
  lastAttempt: string
}

export default function TaskCountrySettingsPage() {
  const [settings, setSettings] = useState<CountrySettings>({
    blockedCountries: ['IN', 'PK', 'BD'],
    isEnabled: true,
    customMessage: 'Tasks are currently not available in your region due to compliance requirements.',
    allowVpnBypass: true,
    logAttempts: true
  })
  
  const [stats, setStats] = useState<CountryStats[]>([])
  const [loading, setLoading] = useState(false)
  const [testCountry, setTestCountry] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const countryNames = {
    'IN': 'India',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia'
  }

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/task-country-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/task-country-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || [])
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/task-country-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings')
    } finally {
      setLoading(false)
    }
  }

  const testCountryBlocking = async () => {
    if (!testCountry) return

    try {
      const response = await fetch('/api/admin/test-country-blocking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: testCountry.toUpperCase() })
      })

      const data = await response.json()
      setTestResult(data.isBlocked ? 'BLOCKED' : 'ALLOWED')
      
      toast.success(`Test completed: ${testCountry.toUpperCase()} is ${data.isBlocked ? 'blocked' : 'allowed'}`)
    } catch (error) {
      console.error('Error testing country:', error)
      toast.error('Error testing country blocking')
    }
  }

  const addCountry = (countryCode: string) => {
    if (!settings.blockedCountries.includes(countryCode)) {
      setSettings({
        ...settings,
        blockedCountries: [...settings.blockedCountries, countryCode]
      })
    }
  }

  const removeCountry = (countryCode: string) => {
    setSettings({
      ...settings,
      blockedCountries: settings.blockedCountries.filter(c => c !== countryCode)
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8 text-blue-600" />
            Task Country Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage geographical restrictions for the task system
          </p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Blocking Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Country Blocking</Label>
                <p className="text-sm text-gray-600">Block task access from specific countries</p>
              </div>
              <Switch
                checked={settings.isEnabled}
                onCheckedChange={(checked) => setSettings({...settings, isEnabled: checked})}
              />
            </div>

            {/* Blocked Countries */}
            <div>
              <Label className="text-base font-medium mb-3 block">Blocked Countries</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.blockedCountries.map(country => (
                  <Badge 
                    key={country} 
                    variant="destructive" 
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <Ban className="h-3 w-3" />
                    {country} ({countryNames[country as keyof typeof countryNames] || country})
                    <button 
                      onClick={() => removeCountry(country)}
                      className="ml-1 hover:bg-red-700 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              
              {/* Quick Add Countries */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(countryNames).map(([code, name]) => (
                  !settings.blockedCountries.includes(code) && (
                    <Button
                      key={code}
                      variant="outline"
                      size="sm"
                      onClick={() => addCountry(code)}
                      className="text-xs"
                    >
                      + {code} ({name})
                    </Button>
                  )
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <Label htmlFor="customMessage" className="text-base font-medium">
                Custom Block Message
              </Label>
              <Textarea
                id="customMessage"
                value={settings.customMessage}
                onChange={(e) => setSettings({...settings, customMessage: e.target.value})}
                placeholder="Message shown to users from blocked countries"
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Allow VPN Bypass</Label>
                  <p className="text-sm text-gray-600">Mention VPN usage in block message</p>
                </div>
                <Switch
                  checked={settings.allowVpnBypass}
                  onCheckedChange={(checked) => setSettings({...settings, allowVpnBypass: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Log Block Attempts</Label>
                  <p className="text-sm text-gray-600">Track blocked access attempts</p>
                </div>
                <Switch
                  checked={settings.logAttempts}
                  onCheckedChange={(checked) => setSettings({...settings, logAttempts: checked})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing & Stats */}
        <div className="space-y-6">
          {/* Country Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Test Country Blocking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter country code (e.g., IN, PK, BD)"
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button onClick={testCountryBlocking} variant="outline">
                  Test
                </Button>
              </div>
              
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResult === 'BLOCKED' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {testResult === 'BLOCKED' ? (
                    <Ban className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {testCountry} is {testResult.toLowerCase()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Block Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.length > 0 ? (
                <div className="space-y-3">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {stat.country} ({stat.countryName})
                        </div>
                        <div className="text-sm text-gray-600">
                          Last attempt: {new Date(stat.lastAttempt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {stat.blockedAttempts} attempts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No blocked attempts recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 mb-1">Important Notice</h3>
              <p className="text-sm text-orange-700">
                Country blocking is based on IP geolocation which may not be 100% accurate. 
                Users can potentially bypass restrictions using VPN services. This feature 
                should be used for compliance purposes and not as a security measure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
