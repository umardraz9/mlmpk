'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageSquare,
  Building,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  CreditCard
} from 'lucide-react'

export default function ContactPage() {
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentAccount[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to submit contact request')
      }
      setSuccess('Your message has been sent. Our support team will contact you shortly.')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send your message. Please try again.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Load admin payment numbers to display for users
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoadingPayments(true)
        const res = await fetch('/api/payment-methods')
        if (!res.ok) throw new Error('Failed to fetch payment methods')
        const data = await res.json()
        if (!cancelled) setPaymentMethods(data?.paymentMethods || [])
      } catch {
        if (!cancelled) setPaymentMethods([])
      } finally {
        if (!cancelled) setLoadingPayments(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const contactInfo = [
    {
      icon: MapPin,
      title: "Head Office",
      details: ["MCNmart Technologies", "Gulberg III, Lahore", "Punjab, Pakistan"],
      color: "green"
    },
    {
      icon: Phone,
      title: "Phone Numbers",
      details: ["+92 300 1234567", "+92 42 1234567", "WhatsApp: +92 300 1234567"],
      color: "blue"
    },
    {
      icon: Mail,
      title: "Email Addresses",
      details: ["support@mcnmart.com", "info@mcnmart.com", "partnerships@mcnmart.com"],
      color: "purple"
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: ["Monday - Friday: 9 AM - 9 PM", "Saturday: 10 AM - 6 PM", "Sunday: 12 PM - 6 PM"],
      color: "orange"
    }
  ]

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#", color: "blue" },
    { icon: Twitter, name: "Twitter", url: "#", color: "sky" },
    { icon: Instagram, name: "Instagram", url: "#", color: "pink" },
    { icon: Linkedin, name: "LinkedIn", url: "#", color: "indigo" }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4 mr-2" />
            Get in Touch
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Contact MCNmart
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            We&apos;re here to help you succeed. Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardHeader>
                <CardTitle className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                {success && (
                  <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="contact-name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="contact-phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="contact-email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="contact-email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Subject *
                    </label>
                    <select
                      name="subject"
                      id="contact-subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="payment">Payment Issues</option>
                      <option value="account">Account Problems</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Message *
                    </label>
                    <textarea
                      name="message"
                      id="contact-message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Please describe your inquiry in detail..."
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-70">
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Admin Payment Accounts */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Admin Payment Accounts
                  </h3>
                </div>
                {loadingPayments ? (
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading payment accounts...</p>
                ) : paymentMethods.length === 0 ? (
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    No admin payment accounts are configured yet. Please check back later.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {paymentMethods.map((pm: PaymentAccount) => (
                      <div key={pm.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{pm.name}</p>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {pm.accountName}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {pm.accountNumber}
                            </p>
                            {pm.bankName && (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Bank: {pm.bankName}{pm.branchCode ? ` (Branch ${pm.branchCode})` : ''}
                              </p>
                            )}
                            {pm.instructions && (
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{pm.instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon
              return (
                <Card key={index} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        info.color === 'green' ? 'bg-green-100 text-green-600' :
                        info.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                        info.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {info.title}
                        </h3>
                        {info.details.map((detail, idx) => (
                          <p key={idx} className={`${isDark ? 'text-gray-300' : 'text-gray-600'} ${idx > 0 ? 'mt-1' : ''}`}>
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Social Media */}
            <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <CardContent className="p-6">
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Follow Us
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {socialLinks.map((social, index) => {
                    const IconComponent = social.icon
                    return (
                      <a
                        key={index}
                        href={social.url}
                        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className={`h-5 w-5 ${
                          social.color === 'blue' ? 'text-blue-600' :
                          social.color === 'sky' ? 'text-sky-600' :
                          social.color === 'pink' ? 'text-pink-600' :
                          'text-indigo-600'
                        }`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {social.name}
                        </span>
                      </a>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <CardHeader>
              <CardTitle className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Building className="w-6 h-6 inline mr-2" />
                Our Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`h-64 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="text-center">
                  <MapPin className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Interactive map will be integrated here
                  </p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    MCNmart Technologies, Gulberg III, Lahore, Punjab, Pakistan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
