'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Share2,
  UserCheck,
  Globe,
  AlertCircle,
  FileText,
  Settings
} from 'lucide-react'

export default function PrivacyPage() {
  const { isDark } = useTheme()

  const sections = [
    {
      id: 'collection',
      title: 'Information We Collect',
      icon: Database,
      content: [
        'Personal Information: Name, email address, phone number, CNIC, and bank account details for verification and payments.',
        'Account Information: Username, password (encrypted), membership level, and account preferences.',
        'Transaction Data: Payment history, withdrawal records, referral activities, and earning summaries.',
        'Technical Information: IP address, device information, browser type, and usage analytics for platform improvement.',
        'Communication Records: Support tickets, feedback, and correspondence with our team.'
      ]
    },
    {
      id: 'usage',
      title: 'How We Use Your Information',
      icon: Settings,
      content: [
        'Account Management: Creating and maintaining your MCNmart account, processing registrations and verifications.',
        'Payment Processing: Facilitating deposits, withdrawals, and commission payments through secure channels.',
        'Platform Security: Preventing fraud, unauthorized access, and ensuring compliance with Pakistani regulations.',
        'Customer Support: Responding to inquiries, resolving issues, and providing technical assistance.',
        'Platform Improvement: Analyzing usage patterns to enhance user experience and develop new features.',
        'Legal Compliance: Meeting regulatory requirements and cooperating with law enforcement when necessary.'
      ]
    },
    {
      id: 'sharing',
      title: 'Information Sharing',
      icon: Share2,
      content: [
        'Payment Processors: Bank details shared with SBP-approved payment gateways for transaction processing.',
        'Regulatory Bodies: Information may be shared with SBP, FBR, or other Pakistani authorities as required by law.',
        'Service Providers: Trusted third-party services for hosting, analytics, and customer support (under strict agreements).',
        'Legal Requirements: Information disclosed when required by court orders, legal proceedings, or regulatory investigations.',
        'We never sell your personal information to advertisers or marketing companies.',
        'Referral information is limited to publicly visible usernames and earning statistics only.'
      ]
    },
    {
      id: 'security',
      title: 'Data Security Measures',
      icon: Lock,
      content: [
        'Encryption: All sensitive data is encrypted using industry-standard AES-256 encryption protocols.',
        'Secure Servers: Data stored on secure servers with regular security audits and monitoring.',
        'Access Controls: Strict employee access controls with multi-factor authentication requirements.',
        'Regular Backups: Automated daily backups with secure off-site storage for data recovery.',
        'SSL Certificates: All data transmission protected by SSL/TLS encryption protocols.',
        'Compliance: Regular security assessments to maintain SOC 2 and ISO 27001 standards.'
      ]
    },
    {
      id: 'retention',
      title: 'Data Retention Policy',
      icon: FileText,
      content: [
        'Active Accounts: Personal and transaction data retained while your account remains active.',
        'Closed Accounts: Data retained for 7 years after account closure for legal and tax compliance.',
        'Financial Records: Transaction history maintained for 10 years as required by Pakistani banking regulations.',
        'Communication Logs: Support tickets and correspondence retained for 3 years for quality assurance.',
        'Marketing Data: Promotional preferences deleted immediately upon unsubscribe request.',
        'Legal Hold: Data may be retained longer if required for ongoing legal proceedings.'
      ]
    },
    {
      id: 'rights',
      title: 'Your Privacy Rights',
      icon: UserCheck,
      content: [
        'Access Rights: Request copies of all personal data we hold about you.',
        'Correction Rights: Update or correct inaccurate personal information in your account.',
        'Deletion Rights: Request deletion of your data (subject to legal retention requirements).',
        'Portability Rights: Receive your data in a structured, machine-readable format.',
        'Objection Rights: Object to processing of your data for marketing or analytics purposes.',
        'Withdrawal Rights: Withdraw consent for data processing where consent is the legal basis.'
      ]
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      icon: Eye,
      content: [
        'Essential Cookies: Required for platform functionality, login sessions, and security features.',
        'Analytics Cookies: Used to understand user behavior and improve platform performance.',
        'Preference Cookies: Store your settings and preferences for a personalized experience.',
        'Marketing Cookies: Track effectiveness of promotional campaigns (with your consent).',
        'Third-party Cookies: Limited use of Google Analytics and payment processor cookies.',
        'Cookie Control: You can manage cookie preferences through your browser settings.'
      ]
    },
    {
      id: 'international',
      title: 'International Users',
      icon: Globe,
      content: [
        'Data Transfer: International user data may be transferred to Pakistan for processing.',
        'Legal Basis: Transfers based on contractual necessity and adequate protection measures.',
        'Local Laws: International users subject to both local and Pakistani privacy regulations.',
        'Data Protection: Same security standards applied regardless of user location.',
        'Jurisdiction: Disputes resolved under Pakistani law and jurisdiction.',
        'Contact Rights: International users have same privacy rights as Pakistani residents.'
      ]
    },
    {
      id: 'minors',
      title: 'Protection of Minors',
      icon: AlertCircle,
      content: [
        'Age Restriction: MCNmart services are only available to users 18 years and older.',
        'Verification Required: Age verification through CNIC or equivalent documentation.',
        'Parental Consent: No collection of information from users under 18 without parental consent.',
        'Account Suspension: Immediate suspension of accounts found to belong to minors.',
        'Data Deletion: Immediate deletion of any data collected from users under 18.',
        'Reporting: Parents can report underage account usage for immediate action.'
      ]
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      icon: AlertCircle,
      content: [
        'Notification: Users notified of privacy policy changes via email and platform notifications.',
        'Effective Date: Changes take effect 30 days after notification unless urgent security updates required.',
        'Consent: Continued use of platform constitutes acceptance of updated privacy policy.',
        'Objection: Users who disagree with changes may close their accounts before effective date.',
        'Version Control: Previous policy versions available upon request for transparency.',
        'Regular Review: Privacy policy reviewed annually and updated as needed for compliance.'
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
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <Shield className="w-4 h-4 mr-2" />
            Privacy & Data Protection
          </div>
          <h1 className={`text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Privacy Policy
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Last Updated:</strong> January 15, 2025 | <strong>Effective Date:</strong> January 1, 2025
            </p>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const IconComponent = section.icon
            return (
              <Card key={section.id} className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <IconComponent className="h-5 w-5 text-blue-600" />
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
              Privacy Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p><strong>Data Protection Officer:</strong> privacy@mcnmart.com</p>
              <p><strong>Company:</strong> MCNmart Technologies</p>
              <p><strong>Address:</strong> Gulberg III, Lahore, Punjab, Pakistan</p>
              <p><strong>Phone:</strong> +92 300 1234567</p>
              <p><strong>Response Time:</strong> Within 30 days for privacy requests</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/terms" className="inline-block">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                  Terms of Service
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
                  Contact Privacy Team
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
