'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, Award, Copy, Share2, DollarSign } from 'lucide-react'

interface CommissionLevel {
  level: number
  name: string
  percentage: number
  amount: number
  color: string
}

const commissionLevels: CommissionLevel[] = [
  { level: 1, name: 'Level 1', percentage: 20, amount: 200, color: 'bg-blue-500' },
  { level: 2, name: 'Level 2', percentage: 15, amount: 150, color: 'bg-green-500' },
  { level: 3, name: 'Level 3', percentage: 10, amount: 100, color: 'bg-yellow-500' },
  { level: 4, name: 'Level 4', percentage: 8, amount: 80, color: 'bg-orange-500' },
  { level: 5, name: 'Level 5', percentage: 7, amount: 70, color: 'bg-red-500' }
]

export default function PartnershipPage() {
  const { data: session } = useSession()
  const [userStats, setUserStats] = useState({
    referralCode: '',
    totalReferrals: 0,
    totalCommissions: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0,
    level4Count: 0,
    level5Count: 0,
    monthlyEarnings: 0
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchUserStats()
    }
  }, [session])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/partnership/stats')
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Error fetching partnership stats:', error)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userStats.referralCode}`
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${userStats.referralCode}`
    const text = `Join MCNmart and start earning! Use my referral code: ${userStats.referralCode}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Join MCNmart Partnership Program',
        text: text,
        url: referralLink
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      copyReferralLink()
    }
  }

  // Show public partnership information for non-logged-in users
  const isLoggedIn = !!session

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Partnership Program</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Earn commissions from 5 levels of your network. The more you grow, the more you earn.
        </p>
      </div>

      {/* Login CTA for non-logged-in users */}
      {!isLoggedIn && (
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Partnership Program</h2>
            <p className="text-gray-700 mb-6">
              Sign in or create an account to access your personalized partnership dashboard, 
              track your referrals, and start earning commissions.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.href = '/auth/login'} size="lg">
                Sign In
              </Button>
              <Button onClick={() => window.location.href = '/auth/register'} variant="outline" size="lg">
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview - Only show for logged-in users */}
      {isLoggedIn && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-2xl font-bold text-gray-900">PKR {userStats.totalCommissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Earnings</p>
                <p className="text-2xl font-bold text-gray-900">PKR {userStats.monthlyEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Partner Level</p>
                <p className="text-2xl font-bold text-gray-900">Gold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Referral Link - Only show for logged-in users */}
      {isLoggedIn && (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link to invite new members and earn commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <code className="text-sm break-all">
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${userStats.referralCode}`}
                </code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={shareReferralLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Enhanced Commission Structure - Show to everyone */}
      <div className="mb-8">
        <div className="text-center mb-12">
          <div className="inline-block">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
              Partnership Program Levels
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mb-6"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Build your network across 5 levels and earn generous commissions on every sale. 
            <span className="block mt-2 text-lg font-semibold text-purple-600">
              The more your network grows, the more you earn! 💰
            </span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-4">
          {commissionLevels.map((level, index) => {
            const count = userStats[`level${level.level}Count` as keyof typeof userStats] as number
            const isActive = count > 0
            
            return (
              <div 
                key={level.level}
                data-delay={index}
                className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25 hover:-translate-y-2 ${
                  level.level === 1 ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-300/30 shadow-lg shadow-blue-500/20' :
                  level.level === 2 ? 'bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-300/30 shadow-lg shadow-emerald-500/20' :
                  level.level === 3 ? 'bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-300/30 shadow-lg shadow-yellow-500/20' :
                  level.level === 4 ? 'bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 border border-orange-300/30 shadow-lg shadow-orange-500/20' :
                  'bg-gradient-to-br from-red-500/10 via-rose-500/10 to-pink-500/10 border border-red-300/30 shadow-lg shadow-red-500/20'
                }`}
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 transition-all duration-500 group-hover:opacity-40 ${
                  level.level === 1 ? 'bg-blue-400' :
                  level.level === 2 ? 'bg-emerald-400' :
                  level.level === 3 ? 'bg-yellow-400' :
                  level.level === 4 ? 'bg-orange-400' :
                  'bg-red-400'
                }`} />
                
                {/* Active Badge with Animation */}
                {isActive && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="relative">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                        ✨ Active
                      </div>
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                  </div>
                )}
                
                <div className="relative p-6">
                  {/* Level Icon & Badge */}
                  <div className="flex flex-col items-center mb-6">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border mb-4 ${
                      level.level === 1 ? 'bg-blue-100/80 text-blue-700 border-blue-200/50 shadow-sm' :
                      level.level === 2 ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50 shadow-sm' :
                      level.level === 3 ? 'bg-yellow-100/80 text-yellow-700 border-yellow-200/50 shadow-sm' :
                      level.level === 4 ? 'bg-orange-100/80 text-orange-700 border-orange-200/50 shadow-sm' :
                      'bg-red-100/80 text-red-700 border-red-200/50 shadow-sm'
                    }`}>
                      <Award className="w-3 h-3 mr-1.5" />
                      Partnership Level
                    </div>
                    
                    <div className="relative group/icon">
                      <div className={`w-20 h-20 rounded-3xl shadow-2xl flex items-center justify-center text-white font-bold text-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                        level.level === 1 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        level.level === 2 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                        level.level === 3 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                        level.level === 4 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                        'bg-gradient-to-br from-red-500 to-pink-600'
                      }`}>
                        {level.level}
                      </div>
                      <div className={`absolute -inset-3 rounded-3xl opacity-30 blur-xl animate-pulse ${
                        level.level === 1 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                        level.level === 2 ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                        level.level === 3 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                        level.level === 4 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                        'bg-gradient-to-br from-red-400 to-pink-500'
                      }`} />
                    </div>
                  </div>
                  
                  {/* Level Details */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{level.name}</h3>
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <div className={`text-3xl font-black ${
                          level.level === 1 ? 'text-blue-600' :
                          level.level === 2 ? 'text-emerald-600' :
                          level.level === 3 ? 'text-yellow-600' :
                          level.level === 4 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {level.percentage}%
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-1 rounded-full border">Partnership Income</span>
                    </div>
                    
                    {/* Enhanced Earnings Display */}
                    <div className="relative group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-2xl blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-300"></div>
                      <div className="relative flex flex-col items-center p-4 rounded-2xl bg-white/90 border border-gray-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-600 font-medium">Current Earnings</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">PKR 0</div>
                        <div className="text-xs text-gray-500">This month</div>
                      </div>
                    </div>
                    
                    {/* Enhanced Network Count */}
                    <div className="relative group/card">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-indigo-200/20 rounded-2xl blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-300"></div>
                      <div className="relative flex flex-col items-center p-4 rounded-2xl bg-white/90 border border-gray-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-gray-600 font-medium">Network Size</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500">members</div>
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Indicator */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                        <span className="font-medium">Next Milestone</span>
                        <span className="font-bold">{Math.min(count, 10)}/10</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${
                              level.level === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                              level.level === 2 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                              level.level === 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                              level.level === 4 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                              'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            data-width={Math.min((count / 10) * 100, 100)}
                            data-delay={index * 0.2}
                          />
                        </div>
                        {Math.min((count / 10) * 100, 100) > 0 && (
                          <div className="absolute top-0 left-0 w-full h-full bg-white/30 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 ${
                  level.level === 1 ? 'shadow-2xl shadow-blue-500/30' :
                  level.level === 2 ? 'shadow-2xl shadow-emerald-500/30' :
                  level.level === 3 ? 'shadow-2xl shadow-yellow-500/30' :
                  level.level === 4 ? 'shadow-2xl shadow-orange-500/30' :
                  'shadow-2xl shadow-red-500/30'
                }`} />
              </div>
            )
          })}
        </div>
        
        {/* Enhanced Total Network Summary */}
        <div className="mt-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 blur-3xl"></div>
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-purple-50/80 to-indigo-50/90 rounded-3xl border border-white/20 shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                Total Network Performance
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your complete partnership network overview and earnings summary
              </p>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100/50 shadow-lg group-hover:shadow-xl transition-all duration-300 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mb-4 mx-auto shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-purple-600 mb-2">{userStats.totalReferrals}</div>
                  <div className="text-sm font-semibold text-gray-600">Total Members</div>
                  <div className="text-xs text-gray-500 mt-1">Network Size</div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100/50 shadow-lg group-hover:shadow-xl transition-all duration-300 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4 mx-auto shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-green-600 mb-2">PKR {userStats.totalCommissions}</div>
                  <div className="text-sm font-semibold text-gray-600">Total Earned</div>
                  <div className="text-xs text-gray-500 mt-1">All Time</div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100/50 shadow-lg group-hover:shadow-xl transition-all duration-300 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl mb-4 mx-auto shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-blue-600 mb-2">PKR {userStats.monthlyEarnings}</div>
                  <div className="text-sm font-semibold text-gray-600">This Month</div>
                  <div className="text-xs text-gray-500 mt-1">Current Period</div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-amber-100/50 shadow-lg group-hover:shadow-xl transition-all duration-300 text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl mb-4 mx-auto shadow-md">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-black text-amber-600 mb-2">5</div>
                  <div className="text-sm font-semibold text-gray-600">Active Levels</div>
                  <div className="text-xs text-gray-500 mt-1">Commission Tiers</div>
                </div>
              </div>
            </div>

            {/* Additional Performance Metrics */}
            <div className="mt-8 pt-8 border-t border-gray-200/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {userStats.level1Count + userStats.level2Count + userStats.level3Count + userStats.level4Count + userStats.level5Count}
                  </div>
                  <div className="text-sm text-gray-600">Active Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {Math.max(userStats.level1Count, userStats.level2Count, userStats.level3Count, userStats.level4Count, userStats.level5Count) > 0 ? 
                      `Level ${commissionLevels.find(l => userStats[`level${l.level}Count` as keyof typeof userStats] === Math.max(userStats.level1Count, userStats.level2Count, userStats.level3Count, userStats.level4Count, userStats.level5Count))?.level || 1}` : 
                      'Getting Started'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Strongest Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {userStats.totalCommissions > 0 ? `${((userStats.monthlyEarnings / userStats.totalCommissions) * 100).toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-sm text-gray-600">Monthly Growth</div>
                </div>
              </div>
            </div>

            {/* Motivational Call-to-Action */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer">
                <Share2 className="w-5 h-5 mr-2" />
                Expand Your Network
              </div>
              <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">
                Invite more partners to unlock higher earnings and grow your passive income stream
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Share & Earn Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20 blur-3xl"></div>
        <Card className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-emerald-50/80 to-teal-50/90 border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-2xl mx-auto">
              <Share2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3">
              Share & Earn
            </CardTitle>
            <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mb-4"></div>
            <CardDescription className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Start building your partnership network today and unlock unlimited earning potential
              <span className="block mt-2 text-lg font-semibold text-emerald-600">
                💎 Transform connections into commissions across 5 profitable levels
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <div className="text-center space-y-8">
              {/* Main CTA Button */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <button 
                  onClick={shareReferralLink}
                  className="relative inline-flex items-center px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/25"
                >
                  <Share2 className="w-6 h-6 mr-3" />
                  Share Referral Link
                  <div className="ml-3 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </button>
              </div>

              {/* Feature Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Build Your Network</h4>
                  <p className="text-sm text-gray-600">Invite friends and family to join your partnership network</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Earn Commissions</h4>
                  <p className="text-sm text-gray-600">Get rewarded on every sale from your 5-level network</p>
                </div>
                
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-teal-600" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Passive Income</h4>
                  <p className="text-sm text-gray-600">Watch your earnings grow as your network expands</p>
                </div>
              </div>

              {/* Motivational Text */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200/50">
                <p className="text-emerald-800 font-semibold text-lg mb-2">
                  🚀 Ready to Start Your Journey?
                </p>
                <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
                  Every person you refer can earn you commissions across 5 levels. The more your network grows, the more you earn! 
                  <span className="font-semibold text-emerald-700">Start sharing today and build your financial freedom.</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
