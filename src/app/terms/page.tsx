'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Shield, 
  Users, 
  CreditCard, 
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function TermsPage() {
  const { isDark } = useTheme()

  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: CheckCircle,
      content: [
        'By accessing and using MCNmart.com, you accept and agree to be bound by the terms and provision of this agreement.',
        'If you do not agree to abide by the above, please do not use this service.',
        'These terms apply to all visitors, users, and others who access or use the service.'
      ]
    },
    {
      id: 'eligibility',
      title: 'User Eligibility',
      icon: Users,
      content: [
        'You must be at least 18 years old to use MCNmart services.',
        'You must be a legal resident of Pakistan or have valid documentation for international users.',
        'You must provide accurate, current, and complete information during registration.',
        'You are responsible for maintaining the confidentiality of your account credentials.'
      ]
    },
    {
      id: 'services',
      title: 'Platform Services',
      icon: Shield,
      content: [
        'MCNmart provides a social sales platform connecting entrepreneurs with earning opportunities.',
        'We offer three membership tiers: Basic (PKR 1,000), Standard (PKR 5,000), and Premium (PKR 10,000).',
        'Services include daily task opportunities, referral commission system, and educational resources.',
        'Platform availability is subject to maintenance windows and technical requirements.'
      ]
    },
    {
      id: 'payments',
      title: 'Payment Terms',
      icon: CreditCard,
      content: [
        'All membership fees are one-time activation payments in Pakistani Rupees (PKR).',
        'Payments are processed through secure, SBP-approved payment gateways.',
        'Earnings are calculated based on completed tasks and referral activities.',
        'Withdrawals are processed within 24-48 hours to verified bank accounts.',
        'Minimum withdrawal amounts: Basic (PKR 2,000), Standard (PKR 1,500), Premium (PKR 1,000).'
      ]
    },
    {
      id: 'referrals',
      title: 'Referral Program',
      icon: Users,
      content: [
        'Our 5-level referral system provides commissions: Level 1 (20%), Level 2 (10%), Level 3 (5%), Level 4 (3%), Level 5 (2%).',
        'Referrals must be genuine individuals, not fake or duplicate accounts.',
        'Commission fraud or manipulation will result in account suspension.',
        'Referral earnings are credited after the referred user completes activation.'
      ]
    },
    {
      id: 'prohibited',
      title: 'Prohibited Activities',
      icon: AlertTriangle,
      content: [
        'Creating multiple accounts or fake profiles is strictly prohibited.',
        'Attempting to manipulate the referral system or commission structure.',
        'Sharing account credentials or allowing unauthorized access.',
        'Engaging in fraudulent activities or money laundering.',
        'Violating Pakistani laws or regulations while using our platform.'
      ]
    },
    {
      id: 'intellectual',
      title: 'Intellectual Property',
      icon: Scale,
      content: [
        'MCNmart and its content are protected by Pakistani and international copyright laws.',
        'Users may not reproduce, distribute, or create derivative works without permission.',
        'All trademarks, logos, and brand names are property of MCNmart Technologies.',
        'User-generated content remains the property of the user but grants MCNmart usage rights.'
      ]
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: Shield,
      content: [
        'MCNmart is not liable for any indirect, incidental, or consequential damages.',
        'Our liability is limited to the amount paid by the user for services.',
        'We do not guarantee specific earning amounts or investment returns.',
        'Users participate in the platform at their own risk and discretion.'
      ]
    },
    {
      id: 'termination',
      title: 'Account Termination',
      icon: AlertTriangle,
      content: [
        'MCNmart reserves the right to suspend or terminate accounts for violations.',
        'Users may close their accounts at any time through the dashboard.',
        'Upon termination, access to platform services will be immediately revoked.',
        'Outstanding earnings will be processed according to standard withdrawal procedures.'
      ]
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      icon: Clock,
      content: [
        'MCNmart reserves the right to modify these terms at any time.',
        'Users will be notified of significant changes via email or platform notifications.',
        'Continued use of the platform constitutes acceptance of modified terms.',
        'Users who disagree with changes may terminate their accounts.'
      ]
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
          <Link href="/" className="flex items-center space-x-2">
            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ← Back to Home
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <FileText className="w-4 h-4 mr-2" />
            Legal Documents
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Terms of Service
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Please read these terms carefully before using MCNmart platform services.
          </p>
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Last Updated:</strong> January 15, 2025 | <strong>Effective Date:</strong> January 1, 2025
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <Card key={section.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-green-900/50' : 'bg-green-100'
                    }`}>
                      <IconComponent className="h-5 w-5 text-green-600" />
                    </div>
                    <span>{index + 1}. {section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.content.map((paragraph, idx) => (
                      <p key={idx} className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Contact Information */}
        <Card className={`mt-12 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p><strong>Company:</strong> MCNmart Technologies</p>
              <p><strong>Address:</strong> Gulberg III, Lahore, Punjab, Pakistan</p>
              <p><strong>Email:</strong> legal@mcnmart.com</p>
              <p><strong>Phone:</strong> +92 300 1234567</p>
              <p><strong>Business Hours:</strong> Monday - Friday, 9 AM - 9 PM PKT</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/privacy" className="inline-block">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Privacy Policy
                </button>
              </Link>
              <Link href="/refund" className="inline-block">
                <button className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  Refund Policy
                </button>
              </Link>
              <Link href="/contact" className="inline-block">
                <button className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  Contact Legal Team
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
