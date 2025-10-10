import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'analytics' | 'financial' | 'operational' | 'custom'
  type: string
  format: string
  timeframe: string
  filters: Record<string, any>
  includeCharts: boolean
  includeRawData: boolean
  isPublic: boolean
  usage: number
  createdAt: string
  createdBy: string
  lastUsed?: string
  tags: string[]
}

// GET - Get report templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const type = searchParams.get('type') || 'all'

    // Mock report templates
    const templates: ReportTemplate[] = [
      {
        id: '1',
        name: 'Weekly Performance Dashboard',
        description: 'Comprehensive weekly performance metrics including users, revenue, and tasks',
        category: 'analytics',
        type: 'analytics',
        format: 'pdf',
        timeframe: '7d',
        filters: {
          includeInactiveUsers: false,
          minimumTaskCompletion: 1
        },
        includeCharts: true,
        includeRawData: false,
        isPublic: true,
        usage: 45,
        createdAt: new Date(Date.now() - 5184000000).toISOString(), // 60 days ago
        createdBy: 'System Admin',
        lastUsed: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
        tags: ['weekly', 'performance', 'overview']
      },
      {
        id: '2',
        name: 'Monthly Financial Summary',
        description: 'Complete financial overview with revenue, expenses, and profit analysis',
        category: 'financial',
        type: 'financial',
        format: 'excel',
        timeframe: '30d',
        filters: {
          includePendingPayments: true,
          currencyConversion: false
        },
        includeCharts: true,
        includeRawData: true,
        isPublic: true,
        usage: 28,
        createdAt: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
        createdBy: 'Finance Manager',
        lastUsed: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        tags: ['monthly', 'financial', 'revenue', 'expenses']
      },
      {
        id: '3',
        name: 'User Engagement Deep Dive',
        description: 'Detailed user behavior analysis with activity patterns and retention metrics',
        category: 'analytics',
        type: 'users',
        format: 'pdf',
        timeframe: '30d',
        filters: {
          segmentByActivity: true,
          includeChurnPrediction: true,
          minSessionDuration: 300 // 5 minutes
        },
        includeCharts: true,
        includeRawData: false,
        isPublic: true,
        usage: 19,
        createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        createdBy: 'Marketing Manager',
        lastUsed: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
        tags: ['users', 'engagement', 'retention', 'behavior']
      },
      {
        id: '4',
        name: 'Task Performance Snapshot',
        description: 'Quick overview of task completion rates and reward distribution',
        category: 'operational',
        type: 'tasks',
        format: 'csv',
        timeframe: '7d',
        filters: {
          excludeTestTasks: true,
          minRewardAmount: 10
        },
        includeCharts: false,
        includeRawData: true,
        isPublic: true,
        usage: 32,
        createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
        createdBy: 'Operations Manager',
        lastUsed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        tags: ['tasks', 'performance', 'rewards', 'completion']
      },
      {
        id: '5',
        name: 'MLM Network Growth Analysis',
        description: 'Network expansion metrics with commission breakdown and team performance',
        category: 'analytics',
        type: 'mlm',
        format: 'pdf',
        timeframe: '90d',
        filters: {
          minNetworkLevel: 2,
          includeInactiveMembers: false,
          commissionThreshold: 100
        },
        includeCharts: true,
        includeRawData: true,
        isPublic: false,
        usage: 12,
        createdAt: new Date(Date.now() - 3888000000).toISOString(), // 45 days ago
        createdBy: 'MLM Manager',
        lastUsed: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        tags: ['mlm', 'network', 'growth', 'commissions']
      },
      {
        id: '6',
        name: 'Product Sales Performance',
        description: 'Product-wise sales analysis with inventory and profitability insights',
        category: 'operational',
        type: 'products',
        format: 'excel',
        timeframe: '30d',
        filters: {
          includeOutOfStock: true,
          minSalesVolume: 5,
          categorizeByMargin: true
        },
        includeCharts: true,
        includeRawData: true,
        isPublic: true,
        usage: 23,
        createdAt: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
        createdBy: 'Product Manager',
        lastUsed: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        tags: ['products', 'sales', 'inventory', 'profitability']
      }
    ]

    // Apply filters
    let filteredTemplates = templates

    if (category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category)
    }

    if (type !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.type === type)
    }

    // Sort by usage (most popular first)
    filteredTemplates.sort((a, b) => b.usage - a.usage)

    const stats = {
      total: templates.length,
      byCategory: {
        analytics: templates.filter(t => t.category === 'analytics').length,
        financial: templates.filter(t => t.category === 'financial').length,
        operational: templates.filter(t => t.category === 'operational').length,
        custom: templates.filter(t => t.category === 'custom').length
      },
      byFormat: {
        pdf: templates.filter(t => t.format === 'pdf').length,
        csv: templates.filter(t => t.format === 'csv').length,
        excel: templates.filter(t => t.format === 'excel').length
      },
      totalUsage: templates.reduce((sum, t) => sum + t.usage, 0),
      mostPopular: templates.reduce((max, t) => t.usage > max.usage ? t : max, templates[0]),
      publicTemplates: templates.filter(t => t.isPublic).length
    }

    return NextResponse.json({
      templates: filteredTemplates,
      stats,
      categories: [
        { value: 'analytics', label: 'Analytics', description: 'Performance and insights reports' },
        { value: 'financial', label: 'Financial', description: 'Revenue, expenses, and financial analysis' },
        { value: 'operational', label: 'Operational', description: 'Day-to-day operations and processes' },
        { value: 'custom', label: 'Custom', description: 'User-created custom templates' }
      ]
    })

  } catch (error) {
    console.error('Error fetching report templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new report template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      type,
      format,
      timeframe,
      filters = {},
      includeCharts = true,
      includeRawData = true,
      isPublic = false,
      tags = []
    } = body

    // Validate required fields
    if (!name || !category || !type || !format || !timeframe) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, category, type, format, timeframe' 
      }, { status: 400 })
    }

    const newTemplate: ReportTemplate = {
      id: Date.now().toString(),
      name,
      description: description || '',
      category,
      type,
      format,
      timeframe,
      filters,
      includeCharts,
      includeRawData,
      isPublic,
      usage: 0,
      createdAt: new Date().toISOString(),
      createdBy: session.user.name || 'Admin',
      tags: Array.isArray(tags) ? tags : []
    }

    // In a real implementation, you would save this to the database

    return NextResponse.json({
      message: 'Report template created successfully',
      template: newTemplate
    })

  } catch (error) {
    console.error('Error creating report template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update report template
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Find and update the template in database
    // 2. Validate the updates
    // 3. Update usage statistics if needed

    return NextResponse.json({
      message: 'Report template updated successfully',
      templateId: id
    })

  } catch (error) {
    console.error('Error updating report template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete report template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Check if template is being used by scheduled reports
    // 2. Delete the template from database
    // 3. Clean up any related data

    return NextResponse.json({
      message: 'Report template deleted successfully',
      templateId
    })

  } catch (error) {
    console.error('Error deleting report template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 