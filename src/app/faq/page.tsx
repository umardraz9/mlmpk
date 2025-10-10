'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ChevronDown, 
  ChevronUp, 
  Search,
  Users,
  CreditCard,
  Shield,
  BookOpen,
  HelpCircle,
  MessageCircle
} from 'lucide-react'

export default function FAQPage() {
  const { isDark } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const categories = [
    { id: 'all', name: 'All Questions', icon: HelpCircle },
    { id: 'account', name: 'Account & Registration', icon: Users },
    { id: 'payments', name: 'Payments & Withdrawals', icon: CreditCard },
    { id: 'partnership', name: 'Partnership Program', icon: BookOpen },
    { id: 'security', name: 'Security & Privacy', icon: Shield }
  ]

  const faqs = [
    {
      category: 'account',
      question: 'How do I create an account on MCNmart?',
      answer: 'Creating an account is completely free! Click on "Register" button, fill in your basic information including name, email, phone number, and create a secure password. You\'ll receive a verification email to activate your account.'
    },
    {
      category: 'account',
      question: 'What documents do I need for account verification?',
      answer: 'For account verification, you need: 1) Valid CNIC (front and back), 2) Bank account details, 3) Phone number verification via OTP. This ensures security and enables withdrawals to your account.'
    },
    {
      category: 'payments',
      question: 'What payment methods are supported?',
      answer: 'We support all major Pakistani payment methods: JazzCash, EasyPaisa, UBL Omni, Bank transfers, and mobile banking. International users can use PayPal and bank transfers.'
    },
    {
      category: 'payments',
      question: 'What is the minimum withdrawal amount?',
      answer: 'The minimum withdrawal amount varies by membership level: Basic Plan - PKR 2,000, Standard Plan - PKR 1,500, Premium Plan - PKR 1,000. Withdrawals are processed within 24-48 hours.'
    },
    {
      category: 'payments',
      question: 'Are there any withdrawal fees?',
      answer: 'No, MCNmart does not charge any withdrawal fees. However, your bank or payment provider may charge their standard transaction fees.'
    },
    {
      category: 'partnership',
      question: 'How does the partnership program work?',
      answer: 'Our 5-level partnership program allows you to earn commissions by referring new members. You earn: Level 1 (20%), Level 2 (10%), Level 3 (5%), Level 4 (3%), Level 5 (2%) from your referrals\' activities.'
    },
    {
      category: 'partnership',
      question: 'How much can I earn daily?',
      answer: 'Daily earnings depend on your membership level and activity: Basic (PKR 50-200), Standard (PKR 100-500), Premium (PKR 200-1000+). Earnings come from daily tasks, referral commissions, and bonus activities.'
    },
    {
      category: 'partnership',
      question: 'Do I need to recruit people to earn money?',
      answer: 'No! You can earn through daily tasks without recruiting anyone. However, building a network through referrals significantly increases your earning potential through our commission structure.'
    },
    {
      category: 'security',
      question: 'Is MCNmart safe and legitimate?',
      answer: 'Yes, MCNmart is fully registered with Pakistani authorities, complies with SBP regulations, and follows international security standards. We use SSL encryption and secure payment gateways.'
    },
    {
      category: 'security',
      question: 'How is my personal data protected?',
      answer: 'We follow strict data protection policies. Your personal information is encrypted, never shared with third parties without consent, and stored on secure servers. See our Privacy Policy for details.'
    },
    {
      category: 'account',
      question: 'Can I change my bank account details?',
      answer: 'Yes, you can update your bank account details in your profile settings. Changes require verification and may take 24-48 hours to process for security reasons.'
    },
    {
      category: 'payments',
      question: 'Why is my withdrawal delayed?',
      answer: 'Withdrawals may be delayed due to: 1) Bank processing times, 2) Account verification pending, 3) Incorrect bank details, 4) Weekend/holiday processing. Contact support if delay exceeds 48 hours.'
    },
    {
      category: 'partnership',
      question: 'How do I track my referrals and commissions?',
      answer: 'Your dashboard shows real-time statistics: total referrals, active members in your network, daily/monthly commissions, and detailed earning reports. You can also download monthly statements.'
    },
    {
      category: 'account',
      question: 'What if I forget my password?',
      answer: 'Click "Forgot Password" on the login page, enter your registered email or phone number, and you\'ll receive a password reset link. Follow the instructions to create a new password.'
    },
    {
      category: 'security',
      question: 'How do I enable two-factor authentication?',
      answer: 'Go to Security Settings in your profile, click "Enable 2FA", scan the QR code with Google Authenticator or similar app, and enter the verification code. This adds extra security to your account.'
    }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4 mr-2" />
            Frequently Asked Questions
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            How can we help?
          </h1>
          <p className={`text-xl max-w-3xl mx-auto mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Find answers to common questions about MCNmart platform, payments, and partnership program.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className={`sticky top-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeCategory === category.id
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredFAQs.length === 0 ? (
                <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-8 text-center">
                    <HelpCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      No questions found
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Try adjusting your search terms or browse different categories.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <Card key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleItem(index)}
                        className={`w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          openItems.includes(index) ? 'border-b border-gray-200 dark:border-gray-700' : ''
                        }`}
                      >
                        <h3 className={`font-semibold pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {faq.question}
                        </h3>
                        {openItems.includes(index) ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>
                      {openItems.includes(index) && (
                        <div className="px-6 py-4">
                          <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Contact Support */}
            <Card className={`mt-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6 text-center">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Still need help?
                </h3>
                <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/contact" className="inline-block">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                      Contact Support
                    </button>
                  </Link>
                  <Link href="/support" className="inline-block">
                    <button className={`px-6 py-2 rounded-lg border transition-colors ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                      Visit Support Center
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
