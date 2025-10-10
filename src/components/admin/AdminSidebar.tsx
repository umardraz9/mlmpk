'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Network, 
  DollarSign, 
  Settings,
  BarChart3,
  ShoppingCart,
  FileText,
  Shield,
  Menu,
  X,
  Home,
  TrendingUp,
  Award,
  Eye,
  CreditCard,
  Wallet,
  Bell,
  MessageSquare,
  Globe,
  SlidersHorizontal,
  Puzzle,
  FileCheck,
  Banknote,
  Crown,
  ClipboardCheck,
  UserPlus,
  FilePlus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle'

interface AdminSidebarProps {
  className?: string
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, description: 'Overview and analytics' },
  { name: 'Users', href: '/admin/users', icon: Users, description: 'Manage users and permissions' },
  { name: 'Users • Task Control', href: '/admin/users/task-control', icon: SlidersHorizontal, description: 'Control user task limits' },
  { name: 'Users • New', href: '/admin/users/new', icon: UserPlus, description: 'Create a new user' },
  { name: 'Orders', href: '/admin/orders', icon: FileText, description: 'Sales order tracking' },
  { name: 'Products', href: '/admin/products', icon: ShoppingCart, description: 'Product catalog management' },
  { name: 'Products • New', href: '/admin/products/new', icon: FilePlus, description: 'Add a new product' },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard, description: 'Manual payment reviews' },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: Banknote, description: 'Withdrawal requests' },
  { name: 'Vouchers', href: '/admin/vouchers', icon: Award, description: 'Voucher management' },
  { name: 'Payment Methods', href: '/admin/payment-methods', icon: Wallet, description: 'Supported payout channels' },
  { name: 'Payment Settings', href: '/admin/payment-settings', icon: Settings, description: 'Configure payment rules' },
  { name: 'Payment Confirmations', href: '/admin/payment-confirmations', icon: FileCheck, description: 'Verify payment proofs' },
  { name: 'Finance', href: '/admin/finance', icon: DollarSign, description: 'Financial overview and reports' },
  { name: 'Financial', href: '/admin/financial', icon: TrendingUp, description: 'Financial KPIs & charts' },
  { name: 'Financial Reports', href: '/admin/financial/reports', icon: FileCheck, description: 'Revenue and expense reports' },
  { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare, description: 'Task management and analytics' },
  { name: 'Task Controls', href: '/admin/task-controls', icon: SlidersHorizontal, description: 'Daily task configurations' },
  { name: 'Tasks • Submissions', href: '/admin/tasks/submissions', icon: ClipboardCheck, description: 'Review task submissions' },
  { name: 'MLM Network', href: '/admin/mlm-network', icon: Network, description: 'Referral tree & hierarchy' },
  { name: 'MLM', href: '/admin/mlm', icon: Network, description: 'MLM settings' },
  { name: 'Commissions', href: '/admin/commissions', icon: TrendingUp, description: 'Commission distribution' },
  { name: 'Commission Settings', href: '/admin/commission-settings', icon: Settings, description: 'Commission tiers & rules' },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Detailed performance insights' },
  { name: 'Analytics • Users', href: '/admin/analytics/users', icon: Users, description: 'User growth and retention' },
  { name: 'Analytics • Products', href: '/admin/analytics/products', icon: ShoppingCart, description: 'Product performance' },
  { name: 'Analytics • Tasks', href: '/admin/analytics/tasks', icon: CheckSquare, description: 'Task performance' },
  { name: 'Analytics • Blog', href: '/admin/analytics/blog', icon: FileText, description: 'Content engagement' },
  { name: 'Analytics • MLM', href: '/admin/analytics/mlm', icon: Network, description: 'Network analytics' },
  { name: 'Blog', href: '/admin/blog', icon: FileText, description: 'Content and blog management' },
  { name: 'Blog • New', href: '/admin/blog/new', icon: FilePlus, description: 'Create a new post' },
  { name: 'Ecommerce', href: '/admin/ecommerce', icon: ShoppingCart, description: 'Store settings' },
  { name: 'Social Reports', href: '/admin/social/reports', icon: MessageSquare, description: 'Social campaigns reports' },
  { name: 'Social Platform', href: '/admin/social-platform', icon: Globe, description: 'Connected social accounts' },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell, description: 'System-wide announcements' },
  { name: 'Extension Settings', href: '/admin/extension-settings', icon: Puzzle, description: 'Browser extension controls' },
  { name: 'Reports', href: '/admin/reports', icon: FileText, description: 'Operations reports' },
  { name: 'Membership Plans', href: '/admin/membership-plans', icon: Crown, description: 'Plan pricing and benefits' },
  { name: 'Register', href: '/admin/register', icon: FileText, description: 'Register new admin members' },
  { name: 'Security', href: '/admin/security', icon: Shield, description: 'Security settings and monitoring' },
  { name: 'Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' },
  { name: 'More', href: '/admin/more', icon: Puzzle, description: 'Additional utilities' },
]

const quickStats = [
  { label: 'Total Users', value: '156', color: 'bg-blue-500' },
  { label: 'Active Tasks', value: '23', color: 'bg-green-500' },
  { label: 'Total Earnings', value: '₨485K', color: 'bg-purple-500' },
  { label: 'Pending Withdrawals', value: '12', color: 'bg-orange-500' }
]

export default function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isDark } = useTheme()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href || pathname === '/admin/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn('shadow-sm', isDark ? 'bg-gray-900/80 text-gray-100 border border-gray-700' : 'bg-white text-gray-900')}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transition-colors duration-300',
        isDark ? 'bg-gray-950 border-r border-gray-800 text-gray-100' : 'bg-white border-r border-gray-200 text-gray-800',
        'transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        
        {/* Header */}
        <div className={cn('flex items-center justify-between p-4 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
          <div className="flex items-center space-x-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isDark ? 'bg-emerald-600/90' : 'bg-blue-600')}>
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Stats */}
        <div className={cn('p-4 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
          <div className="grid grid-cols-2 gap-2">
            {quickStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={cn('w-full h-1 rounded', stat.color)} />
                <div className="text-2xl font-bold mt-1">{stat.value}</div>
                <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors border-l-2',
                  isActive(item.href)
                    ? (isDark ? 'bg-emerald-900/30 text-emerald-300 border-emerald-500' : 'bg-blue-50 text-blue-700 border-blue-700')
                    : (isDark ? 'text-gray-300 hover:bg-gray-900 hover:text-white border-transparent' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent')
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive(item.href)
                      ? (isDark ? 'text-emerald-300' : 'text-blue-700')
                      : (isDark ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-500')
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{item.description}</div>
                </div>
                {isActive(item.href) && (
                  <Badge variant="secondary" className="ml-auto">
                    Active
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn('border-t p-4', isDark ? 'border-gray-800' : 'border-gray-200')}>
          <div className="flex items-center space-x-3">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isDark ? 'bg-gray-800' : 'bg-gray-300')}>
              <Eye className={cn('w-4 h-4', isDark ? 'text-gray-300' : 'text-gray-600')} />
            </div>
            <div>
              <div className="text-sm font-medium">Admin User</div>
              <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>admin@mlm-pak.com</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
