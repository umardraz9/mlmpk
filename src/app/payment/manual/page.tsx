'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Wallet,
  ChevronDown,
  ChevronRight,
  Star,
  Shield,
  CheckCircle,
  Phone,
  CreditCard,
  Upload,
  Clock,
  ArrowLeft,
  Gift,
  Zap,
  DollarSign,
  Info,
  Camera,
  ChevronUp
} from 'lucide-react'
import Image from 'next/image'

const paymentTabs = [
  {
    id: 'bank',
    title: 'BANK ACCOUNT',
    subtitle: 'BANKS',
    icon: Building2,
    color: 'bg-cyan-400',
    methods: [
      { name: 'HBL Bank', code: 'HBL' },
      { name: 'UBL Bank', code: 'UBL' },
      { name: 'MCB Bank', code: 'MCB' },
      { name: 'Allied Bank', code: 'ABL' },
      { name: 'Bank Alfalah', code: 'ALFALAH' },
      { name: 'Standard Chartered', code: 'SCB' },
      { name: 'Faysal Bank', code: 'FAYSAL' },
      { name: 'JS Bank', code: 'JS' },
      { name: 'Askari Bank', code: 'ASKARI' },
      { name: 'Meezan Bank', code: 'MEEZAN' }
    ]
  },
  {
    id: 'wallet',
    title: 'WALLET & OTHERS',
    subtitle: 'DIGITAL WALLETS',
    icon: Wallet,
    color: 'bg-orange-400',
    methods: [
      { name: 'JazzCash', code: 'JAZZCASH', logo: '/images/payment-methods/jazzcash-logo.svg' },
      { name: 'Easypaisa', code: 'EASYPAISA', logo: '/images/payment-methods/easypaisa-logo.svg' },
      { name: 'SadaPay', code: 'SADAPAY', logo: '/images/payment-methods/sadapay-logo.png' },
      { name: 'ZINDIGI', code: 'ZINDIGI', logo: '/images/payment-methods/zindigi-logo.png' },
      { name: 'upaisa', code: 'UPAISA', logo: '/images/payment-methods/upaisa-logo.png' }
    ]
  },
  {
    id: 'raast',
    title: 'RAAST',
    subtitle: 'INSTANT PAYMENT',
    icon: Zap,
    color: 'bg-green-400',
    methods: [
      { name: 'Raast ID Transfer', code: 'RAAST_ID' },
      { name: 'Raast QR Code', code: 'RAAST_QR' },
      { name: 'Raast Account Number', code: 'RAAST_ACCOUNT' }
    ]
  }
]

const banks = [
  'HBL Bank',
  'UBL Bank',
  'MCB Bank',
  'Allied Bank',
  'Bank Alfalah',
  'Standard Chartered',
  'Faysal Bank',
  'JS Bank',
  'Askari Bank',
  'Meezan Bank',
  'National Bank of Pakistan',
  'Habib Metropolitan Bank',
  'Summit Bank',
  'Silk Bank',
  'Bank of Punjab',
  'First Women Bank',
  'Sindh Bank',
  'Bank of Khyber'
]

const membershipPlans = {
  'BASIC': { price: 1000, name: 'Basic Card', dailyRate: 50 },
  'STANDARD': { price: 3000, name: 'Standard Card', dailyRate: 100 },
  'PREMIUM': { price: 6000, name: 'Premium Card', dailyRate: 200 }
}

const adminPaymentMethods = {
  'JAZZCASH': { number: '03001234567', name: 'JazzCash' },
  'EASYPAISA': { number: '03009876543', name: 'EasyPaisa' },
  'BANK_TRANSFER': { number: '1234567890123', name: 'Bank Account', bank: 'HBL Bank' }
}

function PaymentManualForm() {
  const { data: session } = useSession()
  const [selectedTier, setSelectedTier] = useState('STANDARD')
  const [formData, setFormData] = useState({
    amount: '',
    mobileNumber: '',
    transactionId: '',
    paymentMethod: '',
    screenshot: null as File | null,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('PENDING')
  const [activeTab, setActiveTab] = useState('bank')
  const [selectedBank, setSelectedBank] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<any>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, screenshot: file }))
    }
  }

  useEffect(() => {
    // Get tier from URL in useEffect to avoid SSR issues
    const urlParams = new URLSearchParams(window.location.search)
    const tier = urlParams.get('tier') || 'STANDARD'
    if (membershipPlans[tier as keyof typeof membershipPlans]) {
      setSelectedTier(tier)
      setFormData(prev => ({
        ...prev,
        amount: membershipPlans[tier as keyof typeof membershipPlans].price.toString()
      }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.email) {
      alert('Authentication required - session not available')
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('membershipTier', selectedTier)
      formDataToSend.append('amount', formData.amount)
      formDataToSend.append('userPhone', formData.mobileNumber)
      formDataToSend.append('transactionId', formData.transactionId)
      formDataToSend.append('paymentMethod', formData.paymentMethod)
      formDataToSend.append('notes', formData.notes)

      // Add admin account number based on payment method
      const adminMethod = adminPaymentMethods[formData.paymentMethod as keyof typeof adminPaymentMethods]
      if (adminMethod) {
        formDataToSend.append('adminAccount', adminMethod.number)
      }

      if (formData.screenshot) {
        formDataToSend.append('screenshot', formData.screenshot)
      }

      const response = await fetch('/api/payment/manual', {
        method: 'POST',
        body: formDataToSend
      })

      if (response.ok) {
        const result = await response.json()
        setSubmitted(true)
        setOrderNumber(result.orderNumber || result.paymentRequestId)
        setPaymentStatus('PENDING')
        setFormData({
          amount: '',
          mobileNumber: '',
          transactionId: '',
          paymentMethod: '',
          screenshot: null,
          notes: ''
        })
      } else {
        throw new Error('Failed to submit payment request')
      }
    } catch (_error) {
      console.error('Error submitting payment:', _error)
      alert('Failed to submit payment request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to make a payment</h1>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-1">Order Number:</div>
              <div className="text-lg font-mono font-bold text-gray-900">{orderNumber}</div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                paymentStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                Status: {paymentStatus}
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Your payment request has been submitted successfully. Our admin team will review and approve it within 24 hours.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setSubmitted(false)} variant="outline" className="w-full">
                Submit Another Payment
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Payment</h1>
              <p className="text-xs sm:text-sm text-gray-600">MCNmart.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 max-w-lg mx-auto">
        {/* Mobile Hero Section */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Secure Payment</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Pay PKR 1,000 and get PKR 500 voucher balance instantly!
          </p>
        </div>

        {/* Mobile Offer Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 animate-pulse" />
              <span className="font-semibold text-sm">Special Offer</span>
            </div>
            <Badge className="bg-white/20 text-white text-xs px-2 py-1">50% Bonus</Badge>
          </div>
          <h3 className="font-bold text-lg mb-1">Pay PKR 1,000</h3>
          <p className="text-green-100 text-sm">Get PKR 500 voucher balance for products</p>
        </div>

        {/* Payment Method Tabs */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 px-1">Choose Payment Method</h3>

          {/* Tab Headers */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {paymentTabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSelectedMethod(null)
                    setSelectedBank('')
                    setFormData(prev => ({ ...prev, paymentMethod: '' }))
                  }}
                  className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all duration-300 min-w-[120px] ${
                    isActive
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 ${tab.color} rounded-xl flex items-center justify-center transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}>
                      <TabIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className={`font-semibold text-xs ${isActive ? 'text-green-700' : 'text-gray-900'}`}>
                        {tab.title}
                      </h4>
                      <p className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                        {tab.subtitle}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Bank Tab Content */}
            {activeTab === 'bank' && (
              <div className="p-4">
                <div className="mb-4">
                  <Label htmlFor="bankSelect" className="text-sm font-medium text-gray-700 mb-2 block">
                    Please Select Bank
                  </Label>
                  <select
                    id="bankSelect"
                    value={selectedBank}
                    onChange={(e) => {
                      setSelectedBank(e.target.value)
                      setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))
                    }}
                    className="w-full h-12 px-4 text-base rounded-xl border border-gray-300 focus:border-green-500 focus:ring-green-500 bg-white"
                    required
                  >
                    <option value="">Please Select Bank</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                {selectedBank && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                        ACCOUNT NUMBER
                      </Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="Enter your account number"
                        className="h-12 text-base rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnicNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                        CNIC NUMBER
                      </Label>
                      <Input
                        id="cnicNumber"
                        name="cnicNumber"
                        placeholder="Enter your CNIC number"
                        className="h-12 text-base rounded-xl border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Wallet Tab Content */}
            {activeTab === 'wallet' && (
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  {paymentTabs.find(tab => tab.id === 'wallet')?.methods.map((method) => (
                    <div
                      key={method.code}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedMethod?.code === method.code
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedMethod(method)
                        setFormData(prev => ({ ...prev, paymentMethod: method.name }))
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                          {method.logo ? (
                            <Image
                              src={method.logo}
                              alt={`${method.name} logo`}
                              width={32}
                              height={32}
                              className="object-contain"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="text-gray-700 font-bold text-sm">
                              {method.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-gray-900 text-sm">{method.name}</h5>
                            {selectedMethod?.code === method.code && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raast Tab Content */}
            {activeTab === 'raast' && (
              <div className="p-4">
                <div className="grid grid-cols-1 gap-3">
                  {paymentTabs.find(tab => tab.id === 'raast')?.methods.map((method) => (
                    <div
                      key={method.code}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedMethod?.code === method.code
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedMethod(method)
                        setFormData(prev => ({ ...prev, paymentMethod: method.name }))
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white border-2 border-gray-300 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-semibold text-gray-900 text-sm">{method.name}</h5>
                            {selectedMethod?.code === method.code && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Selected Payment Summary */}
        {(selectedMethod || selectedBank) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {activeTab === 'bank' ? (
                  <Building2 className="w-5 h-5 text-white" />
                ) : activeTab === 'raast' ? (
                  <Zap className="w-5 h-5 text-white" />
                ) : selectedMethod?.logo ? (
                  <Image
                    src={selectedMethod.logo}
                    alt={`${selectedMethod.name} logo`}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : (
                  <Wallet className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="font-semibold text-sm">Selected Method</span>
                </div>
                <h4 className="font-bold text-base">
                  {activeTab === 'bank' ? selectedBank : selectedMethod?.name}
                </h4>
                <p className="text-green-100 text-xs">
                  {activeTab === 'bank' ? 'Bank Transfer' :
                   activeTab === 'raast' ? 'Instant Payment System' :
                   'Digital Wallet'}
                </p>
              </div>
              <Shield className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Mobile Payment Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-lg">Payment Details</h3>
            <p className="text-sm text-gray-600 mt-1">Fill in your payment information</p>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Amount and Payment Method */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700 mb-2 block">
                    Amount (PKR)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="1000"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                      required
                      min="100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment Method
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="paymentMethod"
                      name="paymentMethod"
                      placeholder="Select payment method above"
                      value={formData.paymentMethod}
                      className="pl-10 h-12 text-base rounded-xl border-gray-200 bg-gray-50"
                      readOnly
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700 mb-2 block">
                  Transaction ID
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="transactionId"
                    name="transactionId"
                    placeholder="Enter transaction ID from receipt"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {/* Mobile Screenshot Upload */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Payment Screenshot
                </Label>
                <div className="mt-2">
                  <label
                    htmlFor="screenshot"
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center py-4">
                      <Upload className="w-6 h-6 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 text-center px-2">
                        <span className="font-semibold">Tap to upload</span><br />
                        payment screenshot
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                  {formData.screenshot && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">
                          {formData.screenshot.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="text-base rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || (!selectedMethod && !selectedBank)}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Submit Payment Request</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2 text-base">Important Information</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <Clock className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Payment verification takes 24-48 hours</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Make sure your transaction ID is correct</span>
                </div>
                <div className="flex items-start gap-2">
                  <Camera className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Upload a clear screenshot of payment receipt</span>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Rs 500 voucher balance added after approval</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Contact support if you face any issues</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ManualPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment page...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentManualForm />
    </Suspense>
  )
}
