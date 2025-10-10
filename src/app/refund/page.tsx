'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  RefreshCw, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'

export default function RefundPage() {
  const { isDark } = useTheme()

  const refundPolicies = [
    {
      id: 'membership',
      title: 'Membership Fee Refunds',
      icon: CreditCard,
      eligible: [
        'Technical issues preventing account activation within 48 hours',
        'Duplicate payment charges due to system errors',
        'Unauthorized transactions reported within 24 hours',
        'Platform unavailability for more than 72 consecutive hours'
      ],
      notEligible: [
        'Change of mind after successful account activation',
        'Failure to meet earning expectations',
        'Account suspension due to policy violations',
        'Requests made after 7 days of payment'
      ],
      timeframe: '7 days from payment date',
      process: '3-5 business days after approval'
    },
    {
      id: 'earnings',
      title: 'Earning Disputes',
      icon: RefreshCw,
      eligible: [
        'System errors in commission calculations',
        'Missing referral commissions for verified referrals',
        'Technical glitches affecting task completion',
        'Incorrect deductions from account balance'
      ],
      notEligible: [
        'Referrals who violated platform terms',
        'Incomplete or invalid task submissions',
        'Earnings from suspended referral accounts',
        'Commission adjustments due to chargebacks'
      ],
      timeframe: '30 days from transaction date',
      process: '5-7 business days after investigation'
    }
  ]

  const refundProcess = [
    {
      step: 1,
      title: 'Submit Request',
      description: 'Contact our support team with transaction details and reason for refund',
      icon: FileText,
      timeframe: 'Immediate'
    },
    {
      step: 2,
      title: 'Verification',
      description: 'Our team verifies the transaction and checks eligibility criteria',
      icon: CheckCircle,
      timeframe: '1-2 business days'
    },
    {
      step: 3,
      title: 'Investigation',
      description: 'Detailed review of account activity and transaction history',
      icon: Clock,
      timeframe: '2-3 business days'
    },
    {
      step: 4,
      title: 'Decision',
      description: 'Approval or denial notification sent via email and SMS',
      icon: Mail,
      timeframe: '1 business day'
    },
    {
      step: 5,
      title: 'Processing',
      description: 'Approved refunds processed to original payment method',
      icon: CreditCard,
      timeframe: '3-5 business days'
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
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-800 text-sm font-medium mb-6">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refund Policy
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Refund Policy
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Understanding our refund procedures and eligibility criteria for MCNmart services.
          </p>
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-orange-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-orange-800'}`}>
              <strong>Last Updated:</strong> January 15, 2025 | <strong>Effective Date:</strong> January 1, 2025
            </p>
          </div>
        </div>

        {/* Refund Policies */}
        <div className="space-y-8 mb-12">
          {refundPolicies.map((policy) => {
            const IconComponent = policy.icon
            return (
              <Card key={policy.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-orange-900/50' : 'bg-orange-100'
                    }`}>
                      <IconComponent className="h-5 w-5 text-orange-600" />
                    </div>
                    <span>{policy.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Eligible Cases */}
                    <div>
                      <h4 className={`font-semibold mb-3 flex items-center ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Eligible for Refund
                      </h4>
                      <ul className="space-y-2">
                        {policy.eligible.map((item, idx) => (
                          <li key={idx} className={`text-sm flex items-start ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Not Eligible Cases */}
                    <div>
                      <h4 className={`font-semibold mb-3 flex items-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Not Eligible for Refund
                      </h4>
                      <ul className="space-y-2">
                        {policy.notEligible.map((item, idx) => (
                          <li key={idx} className={`text-sm flex items-start ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Request Timeframe
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {policy.timeframe}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex items-center mb-1">
                        <Clock className="w-4 h-4 mr-2 text-purple-600" />
                        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Processing Time
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {policy.process}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Refund Process */}
        <Card className={`mb-12 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              Refund Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {refundProcess.map((step, index) => {
                const IconComponent = step.icon
                return (
                  <div key={step.step} className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Step {step.step}: {step.title}
                        </h4>
                        <span className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {step.timeframe}
                        </span>
                      </div>
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {step.description}
                      </p>
                      {index < refundProcess.length - 1 && (
                        <div className={`w-px h-6 ml-5 mt-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className={`mb-12 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>• Refunds are processed to the original payment method used for the transaction.</p>
              <p>• Bank processing times may add 2-5 additional business days for refund receipt.</p>
              <p>• Partial refunds may apply in cases of promotional discounts or bonus credits.</p>
              <p>• All refund requests must include transaction ID and detailed explanation.</p>
              <p>• Fraudulent refund requests may result in account suspension.</p>
              <p>• International users may incur currency conversion fees during refund processing.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
              Request a Refund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>To request a refund, contact our support team with the following information:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Transaction ID or payment reference number</li>
                <li>Date and amount of transaction</li>
                <li>Detailed reason for refund request</li>
                <li>Supporting documentation (if applicable)</li>
              </ul>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Support</span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  refunds@mcnmart.com
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Response within 24 hours
                </p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center mb-2">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone Support</span>
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  +92 300 1234567
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  9 AM - 9 PM PKT
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="inline-block">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Contact Support
                </button>
              </Link>
              <Link href="/terms" className="inline-block">
                <button className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  Terms of Service
                </button>
              </Link>
              <Link href="/faq" className="inline-block">
                <button className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                  isDark 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}>
                  View FAQ
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
