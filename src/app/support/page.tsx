'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  BookOpen, 
  Users, 
  Shield,
  ArrowRight,
  Headphones,
  FileText,
  HelpCircle,
  CreditCard
} from 'lucide-react'

export default function SupportPage() {
  const { isDark } = useTheme()
  type PaymentAccount = {
    id: string
    name: string
    type: string
    accountName: string | null
    accountNumber: string | null
    bankName?: string | null
    branchCode?: string | null
    instructions?: string | null
    displayOrder: number
    monthlyLimitPkr?: number | null
  }
  const [adminNumber, setAdminNumber] = useState<string | null>(null)
  const [loadingNumbers, setLoadingNumbers] = useState(true)

  // Load an admin payment number to reuse for WhatsApp/Phone support
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoadingNumbers(true)
        const res = await fetch('/api/payment-methods')
        if (!res.ok) throw new Error('failed')
        const data = await res.json()
        const methods: PaymentAccount[] = data?.paymentMethods || []
        // Prefer a wallet number (JazzCash/EasyPaisa)
        const wallet = methods.find((m: PaymentAccount) => m.type === 'MOBILE_WALLET' && m.accountNumber)
        const number: string | null = (wallet?.accountNumber || methods[0]?.accountNumber || null)
        if (!cancelled) setAdminNumber(number)
      } catch {
        if (!cancelled) setAdminNumber(null)
      } finally {
        if (!cancelled) setLoadingNumbers(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Derive WhatsApp and tel links
  const { whatsappHref, telHref, mailHref } = useMemo(() => {
    const fallbackPhone = '+92 300 1234567'
    const clean = (adminNumber || fallbackPhone).replace(/\D/g, '')
    // Ensure country code 92 prefix for wa.me
    const wa = clean.startsWith('92') ? clean : clean.startsWith('0') ? `92${clean.slice(1)}` : `92${clean}`
    return {
      whatsappHref: `https://wa.me/${wa}?text=${encodeURIComponent('Hi MCNmart Support, I need help.')}`,
      telHref: `tel:+${wa}`,
      mailHref: 'mailto:support@mcnmart.com'
    }
  }, [adminNumber])

  const supportOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: "24/7 Available",
      color: "green"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      action: "+92 300 1234567",
      available: "9 AM - 9 PM PKT",
      color: "blue"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us detailed queries via email",
      action: "support@mcnmart.com",
      available: "Response within 24 hours",
      color: "purple"
    }
  ]

  const helpCategories = [
    {
      icon: Users,
      title: "Account & Registration",
      description: "Help with account setup, verification, and login issues",
      articles: 12
    },
    {
      icon: CreditCard,
      title: "Payments & Withdrawals",
      description: "Payment methods, withdrawal process, and transaction issues",
      articles: 18
    },
    {
      icon: BookOpen,
      title: "Partnership Program",
      description: "Understanding levels, commissions, and referral system",
      articles: 15
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Account security, data protection, and safety guidelines",
      articles: 8
    }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-green-50 to-blue-50'
    }`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ← Back to Home
              </span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <Headphones className="w-4 h-4 mr-2" />
            MCNmart Support Center
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            How can we help you?
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Get the support you need to succeed on Pakistan&apos;s premier social sales platform
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {supportOptions.map((option, index) => {
            const IconComponent = option.icon
            return (
              <Card key={index} className={`text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <CardHeader>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    option.color === 'green' ? 'bg-green-100 text-green-600' :
                    option.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <CardTitle className={isDark ? 'text-white' : 'text-gray-900'}>
                    {option.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                  {option.title === 'Live Chat Support' ? (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className={`w-full mb-2 ${
                        option.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                        option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      } text-white`}>
                        {loadingNumbers ? 'Loading...' : option.action}
                      </Button>
                    </a>
                  ) : option.title === 'Phone Support' ? (
                    <a href={telHref} className="block">
                      <Button className={`w-full mb-2 ${
                        option.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                        option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      } text-white`}>
                        {adminNumber || option.action}
                      </Button>
                    </a>
                  ) : (
                    <a href={mailHref} className="block">
                      <Button className={`w-full mb-2 ${
                        option.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                        option.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      } text-white`}>
                        {option.action}
                      </Button>
                    </a>
                  )}
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {option.available}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Browse Help Topics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {helpCategories.map((category, index) => {
              const IconComponent = category.icon
              return (
                <Link key={index} href="/faq" className="block">
                  <Card className={`h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                    isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        isDark ? 'bg-green-900/50' : 'bg-green-100'
                      }`}>
                        <IconComponent className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {category.title}
                      </h3>
                      <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {category.articles} articles
                        </span>
                        <ArrowRight className="h-4 w-4 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className={`rounded-2xl p-8 text-center ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quick Links
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/faq">
              <Button variant="outline" className="w-full">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                Terms & Policies
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
