'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/hooks/useSession'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileDown, 
  Download,
  Eye,
  Calendar,
  Filter,
  BarChart3,
  DollarSign,
  Users,
  CheckSquare,
  Package,
  ShoppingCart,
  Target,
  FileText,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Send,
  Save
} from 'lucide-react'

interface ReportConfig {
  reportTypes: Array<{
    type: string
    name: string
    description: string
    dataPoints: string[]
    estimatedSize: string
  }>
  timeframes: Array<{
    value: string
    label: string
    description: string
  }>
  formats: Array<{
    value: string
    label: string
    description: string
    pros: string[]
    cons: string[]
  }>
  maxFileSize: string
  estimatedGenerationTime: {
    small: string
    medium: string
    large: string
  }
}

interface GeneratedReport {
  id: string
  title: string
  type: string
  format: string
  timeframe: string
  status: 'generating' | 'completed' | 'failed'
  fileSize?: string
  downloadUrl?: string
  createdAt: string
  generatedBy: string
}

export default function AdminReportsPage() {
  const { data: session } = useSession()
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null)
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('generate')

  // Form state for report generation
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    type: '',
    format: 'pdf',
    timeframe: '30d',
    includeCharts: true,
    includeRawData: true,
    filters: {}
  })

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchReportConfig()
      fetchGeneratedReports()
    }
  }, [session])

  const fetchReportConfig = async () => {
    try {
      const response = await fetch('/api/admin/reports/generate')
      const data = await response.json()
      
      if (response.ok) {
        setReportConfig(data)
      }
    } catch (error) {
      console.error('Error fetching report config:', error)
    }
  }

  const fetchGeneratedReports = async () => {
    try {
      const response = await fetch('/api/admin/reports/history')
      const data = await response.json()
      
      if (response.ok) {
        setGeneratedReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const generateReport = async () => {
    if (!formData.title || !formData.type) {
      alert('Please provide a title and select a report type')
      return
    }

    try {
      setGenerating(true)
      setGenerationProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (response.ok) {
        // Download the file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const contentDisposition = response.headers.get('Content-Disposition')
        const fileName = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `report-${Date.now()}.${formData.format}`
        
        a.download = fileName
        a.click()
        window.URL.revokeObjectURL(url)

        // Refresh reports list
        fetchGeneratedReports()
        
        // Reset form
        setFormData({
          title: '',
          subtitle: '',
          description: '',
          type: '',
          format: 'pdf',
          timeframe: '30d',
          includeCharts: true,
          includeRawData: true,
          filters: {}
        })

        alert('Report generated and downloaded successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setGenerating(false)
      setGenerationProgress(0)
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'analytics':
        return <BarChart3 className="h-5 w-5 text-blue-600" />
      case 'financial':
        return <DollarSign className="h-5 w-5 text-green-600" />
      case 'users':
        return <Users className="h-5 w-5 text-purple-600" />
      case 'tasks':
        return <CheckSquare className="h-5 w-5 text-orange-600" />
      case 'products':
        return <Package className="h-5 w-5 text-indigo-600" />
      case 'orders':
        return <ShoppingCart className="h-5 w-5 text-pink-600" />
      case 'mlm':
        return <Target className="h-5 w-5 text-red-600" />
      case 'blog':
        return <FileText className="h-5 w-5 text-teal-600" />
      default:
        return <FileDown className="h-5 w-5 text-gray-600" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄'
      case 'csv':
        return '📊'
      case 'excel':
        return '📈'
      default:
        return '📁'
    }
  }

  const getEstimatedTime = (type: string) => {
    if (!reportConfig) return 'Unknown'
    
    const reportType = reportConfig.reportTypes.find(rt => rt.type === type)
    if (!reportType) return 'Unknown'
    
    const size = reportType.estimatedSize.toLowerCase()
    return reportConfig.estimatedGenerationTime[size as keyof typeof reportConfig.estimatedGenerationTime] || 'Unknown'
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p>Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileDown className="h-8 w-8 text-blue-600" />
            Reports & Data Export
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive reports and export platform data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchGeneratedReports}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {['generate', 'history', 'templates'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className="flex-1"
          >
            {tab === 'generate' && <Plus className="h-4 w-4 mr-1" />}
            {tab === 'history' && <Clock className="h-4 w-4 mr-1" />}
            {tab === 'templates' && <Settings className="h-4 w-4 mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Configuration */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Report Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Monthly Analytics Report"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="Performance metrics for the month"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed report covering all key metrics..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Report Type */}
                <div className="space-y-4">
                  <Label>Report Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportConfig?.reportTypes.map((type) => (
                      <div
                        key={type.type}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.type === type.type
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({ ...formData, type: type.type })}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getReportTypeIcon(type.type)}
                          <span className="font-medium text-sm">{type.name}</span>
                        </div>
                        <p className="text-xs text-gray-600">{type.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {type.estimatedSize}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Format and Timeframe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Export Format</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportConfig?.formats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            <div className="flex items-center gap-2">
                              <span>{getFormatIcon(format.value)}</span>
                              {format.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timeframe">Time Period</Label>
                    <Select value={formData.timeframe} onValueChange={(value) => setFormData({ ...formData, timeframe: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportConfig?.timeframes.map((timeframe) => (
                          <SelectItem key={timeframe.value} value={timeframe.value}>
                            {timeframe.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <Label>Report Options</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeCharts}
                        onChange={(e) => setFormData({ ...formData, includeCharts: e.target.checked })}
                        className="rounded"
                      />
                      <span>Include charts and visualizations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeRawData}
                        onChange={(e) => setFormData({ ...formData, includeRawData: e.target.checked })}
                        className="rounded"
                      />
                      <span>Include raw data tables</span>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <Button
                    onClick={generateReport}
                    disabled={generating || !formData.title || !formData.type}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate & Download Report
                      </>
                    )}
                  </Button>
                  
                  {generating && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Generation Progress</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview & Info */}
          <div className="space-y-6">
            {/* Selected Report Info */}
            {formData.type && reportConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getReportTypeIcon(formData.type)}
                    Report Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const selectedType = reportConfig.reportTypes.find(rt => rt.type === formData.type)
                    const selectedFormat = reportConfig.formats.find(f => f.value === formData.format)
                    const selectedTimeframe = reportConfig.timeframes.find(tf => tf.value === formData.timeframe)
                    
                    if (!selectedType || !selectedFormat || !selectedTimeframe) return null
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold">{selectedType.name}</h4>
                          <p className="text-sm text-gray-600">{selectedType.description}</p>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span>{selectedFormat.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Period:</span>
                            <span>{selectedTimeframe.label}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Size:</span>
                            <span>{selectedType.estimatedSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Est. Time:</span>
                            <span>{getEstimatedTime(formData.type)}</span>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Data Points Included:</h5>
                          <div className="flex flex-wrap gap-1">
                            {selectedType.dataPoints.map((point) => (
                              <Badge key={point} variant="secondary" className="text-xs">
                                {point}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Format Info */}
            {formData.format && reportConfig && (
              <Card>
                <CardHeader>
                  <CardTitle>Format Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const selectedFormat = reportConfig.formats.find(f => f.value === formData.format)
                    if (!selectedFormat) return null
                    
                    return (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">{selectedFormat.description}</p>
                        
                        <div>
                          <h5 className="font-medium text-green-600 mb-1">Advantages:</h5>
                          <ul className="text-sm space-y-1">
                            {selectedFormat.pros.map((pro, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-orange-600 mb-1">Limitations:</h5>
                          <ul className="text-sm space-y-1">
                            {selectedFormat.cons.map((con, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {generatedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileDown className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No reports generated yet</p>
                <p className="text-sm">Create your first report using the Generate tab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getReportTypeIcon(report.type)}
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{report.format.toUpperCase()}</span>
                            <span>{report.timeframe}</span>
                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                            {report.fileSize && <span>{report.fileSize}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={report.status === 'completed' ? 'default' : report.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {report.status}
                        </Badge>
                        {report.status === 'completed' && report.downloadUrl && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>Report Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Report templates coming soon</p>
              <p className="text-sm">Save frequently used report configurations as templates</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 