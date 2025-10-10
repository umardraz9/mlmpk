import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reportGenerator, ReportConfig } from '@/lib/reporting/report-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      type,
      format,
      timeframe,
      filters,
      includeCharts = true,
      includeRawData = true,
      template
    }: ReportConfig = body

    // Validate required fields
    if (!title || !type || !format || !timeframe) {
      return NextResponse.json({ 
        error: 'Title, type, format, and timeframe are required' 
      }, { status: 400 })
    }

    const config: ReportConfig = {
      title,
      subtitle,
      description,
      type,
      format,
      timeframe,
      filters: filters || {},
      includeCharts,
      includeRawData,
      template
    }

    // Generate report data based on type
    let reportData
    switch (type) {
      case 'analytics':
        reportData = await reportGenerator.generateAnalyticsReport(config)
        break
      case 'financial':
        reportData = await reportGenerator.generateFinancialReport(config)
        break
      case 'users':
        reportData = await reportGenerator.generateUserReport(config)
        break
      case 'tasks':
        reportData = await reportGenerator.generateTaskReport(config)
        break
      case 'products':
        reportData = await reportGenerator.generateProductReport(config)
        break
      case 'orders':
        reportData = await reportGenerator.generateOrderReport(config)
        break
      case 'mlm':
        reportData = await reportGenerator.generateMLMReport(config)
        break
      case 'blog':
        reportData = await reportGenerator.generateBlogReport(config)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Generate file based on format
    let fileBuffer: Buffer
    let contentType: string
    let fileName: string

    switch (format) {
      case 'pdf':
        fileBuffer = await reportGenerator.generatePDF(reportData, config)
        contentType = 'application/pdf'
        fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${timeframe}-${Date.now()}.pdf`
        break
      case 'csv':
        const csvContent = reportGenerator.generateCSV(reportData, config)
        fileBuffer = Buffer.from(csvContent, 'utf8')
        contentType = 'text/csv'
        fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${timeframe}-${Date.now()}.csv`
        break
      case 'excel':
        fileBuffer = reportGenerator.generateExcel(reportData, config)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = `${title.replace(/\s+/g, '-').toLowerCase()}-${timeframe}-${Date.now()}.xlsx`
        break
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get available report templates and configurations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportTypes = [
      {
        type: 'analytics',
        name: 'Platform Analytics',
        description: 'Comprehensive platform performance metrics',
        dataPoints: ['users', 'revenue', 'orders', 'tasks', 'products'],
        estimatedSize: 'Medium'
      },
      {
        type: 'financial',
        name: 'Financial Report',
        description: 'Revenue, expenses, commissions, and profitability analysis',
        dataPoints: ['revenue', 'expenses', 'commissions', 'profits', 'cash flow'],
        estimatedSize: 'Large'
      },
      {
        type: 'users',
        name: 'User Analytics',
        description: 'User behavior, engagement, and performance metrics',
        dataPoints: ['registrations', 'activity', 'retention', 'earnings'],
        estimatedSize: 'Medium'
      },
      {
        type: 'tasks',
        name: 'Task Performance',
        description: 'Task completion rates, engagement, and reward analytics',
        dataPoints: ['completions', 'rewards', 'engagement', 'categories'],
        estimatedSize: 'Small'
      },
      {
        type: 'products',
        name: 'Product Analytics',
        description: 'Sales performance, inventory, and customer insights',
        dataPoints: ['sales', 'inventory', 'revenue', 'trends'],
        estimatedSize: 'Medium'
      },
      {
        type: 'orders',
        name: 'Order Analytics',
        description: 'Order trends, payment analysis, and fulfillment metrics',
        dataPoints: ['orders', 'payments', 'fulfillment', 'returns'],
        estimatedSize: 'Medium'
      },
      {
        type: 'mlm',
        name: 'MLM Network Analysis',
        description: 'Network growth, team performance, and commission analytics',
        dataPoints: ['network', 'commissions', 'growth', 'levels'],
        estimatedSize: 'Large'
      },
      {
        type: 'blog',
        name: 'Content Analytics',
        description: 'Blog performance, engagement, and SEO metrics',
        dataPoints: ['posts', 'views', 'engagement', 'seo'],
        estimatedSize: 'Small'
      }
    ]

    const timeframes = [
      { value: '7d', label: 'Last 7 Days', description: 'Recent short-term trends' },
      { value: '30d', label: 'Last 30 Days', description: 'Monthly performance' },
      { value: '90d', label: 'Last 90 Days', description: 'Quarterly analysis' },
      { value: '1y', label: 'Last Year', description: 'Annual performance' },
      { value: 'all', label: 'All Time', description: 'Complete historical data' }
    ]

    const formats = [
      { 
        value: 'pdf', 
        label: 'PDF Report', 
        description: 'Professional formatted report with charts and tables',
        pros: ['Professional layout', 'Charts included', 'Print-ready'],
        cons: ['Large file size', 'Not editable']
      },
      { 
        value: 'csv', 
        label: 'CSV Export', 
        description: 'Raw data in comma-separated values format',
        pros: ['Small file size', 'Easy to import', 'Editable'],
        cons: ['No formatting', 'No charts', 'Data only']
      },
      { 
        value: 'excel', 
        label: 'Excel Workbook', 
        description: 'Multi-sheet Excel file with formatting',
        pros: ['Multiple sheets', 'Editable', 'Formatted'],
        cons: ['Medium file size', 'Requires Excel']
      }
    ]

    return NextResponse.json({
      reportTypes,
      timeframes,
      formats,
      maxFileSize: '50MB',
      estimatedGenerationTime: {
        small: '30-60 seconds',
        medium: '1-3 minutes',
        large: '3-10 minutes'
      }
    })

  } catch (error) {
    console.error('Error fetching report configurations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 