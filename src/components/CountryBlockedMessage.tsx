'use client'

import { AlertTriangle, Globe, Shield, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CountryBlockedMessageProps {
  country?: string
  countryName?: string
  message?: string
  showAlternatives?: boolean
}

export default function CountryBlockedMessage({ 
  country, 
  countryName, 
  message,
  showAlternatives = true 
}: CountryBlockedMessageProps) {
  const defaultMessage = `Tasks are currently not available in ${countryName || 'your region'} due to regional compliance requirements.`
  
  const alternatives = [
    {
      icon: '🛍️',
      title: 'Shop Products',
      description: 'Browse and purchase from our product catalog',
      action: 'Go to Products',
      href: '/products'
    },
    {
      icon: '👥',
      title: 'Referral Program',
      description: 'Earn commissions by referring new members',
      action: 'View Referrals',
      href: '/partnership'
    },
    {
      icon: '💎',
      title: 'Membership Benefits',
      description: 'Access exclusive member rewards and features',
      action: 'View Benefits',
      href: '/membership'
    },
    {
      icon: '📱',
      title: 'Platform Features',
      description: 'Explore all other available features',
      action: 'Go to Dashboard',
      href: '/dashboard'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Main Block Message */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 mb-8">
        <CardContent className="pt-8 pb-8">
          <div className="text-center space-y-6">
            {/* Icon and Title */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <Globe className="h-10 w-10 text-orange-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Tasks Not Available
              </h1>
              {countryName && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Globe className="h-4 w-4 mr-2" />
                  {countryName} ({country})
                </Badge>
              )}
            </div>

            {/* Message */}
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed">
                {message || defaultMessage}
              </p>
            </div>

            {/* VPN Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-800">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">
                  You can use a VPN to access from a different region
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Features */}
      {showAlternatives && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              What You Can Still Do
            </h2>
            <p className="text-gray-600">
              Explore these available features while tasks are restricted in your region
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {alternatives.map((alt, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardContent className="pt-6 pb-6">
                  <div className="text-center space-y-4">
                    <div className="text-4xl mb-3">{alt.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {alt.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {alt.description}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = alt.href}
                    >
                      {alt.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Support Notice */}
      <Card className="mt-8 border-gray-200 bg-gray-50">
        <CardContent className="pt-6 pb-6">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-6 w-6 text-gray-600 mx-auto" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600">
                If you believe this restriction was applied in error, please contact our support team.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
