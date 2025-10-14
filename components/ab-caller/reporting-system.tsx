"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Clock,
  Mail,
  Share2,
  Calendar,
  Filter,
  Eye,
  Send,
  Printer,
  FileSpreadsheet,
  FilePdf,
  FileJson
} from "lucide-react"

interface Report {
  id: string
  name: string
  type: 'executive' | 'detailed' | 'custom'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  status: 'generating' | 'ready' | 'failed'
  createdAt: string
  size: string
  downloadUrl?: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'executive' | 'technical' | 'compliance' | 'custom'
  fields: string[]
  format: string[]
  icon: React.ReactNode
}

interface ReportingSystemProps {
  testData: any
  onReportGenerated: (report: Report) => void
}

export function ReportingSystem({ testData, onReportGenerated }: ReportingSystemProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [reports, setReports] = useState<Report[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Sample reports
  const sampleReports: Report[] = [
    {
      id: '1',
      name: 'Executive Summary - Q1 2024',
      type: 'executive',
      format: 'pdf',
      status: 'ready',
      createdAt: '2024-01-15T10:00:00Z',
      size: '2.3 MB',
      downloadUrl: '/reports/executive-q1-2024.pdf'
    },
    {
      id: '2',
      name: 'Detailed Test Analysis',
      type: 'detailed',
      format: 'excel',
      status: 'ready',
      createdAt: '2024-01-14T15:30:00Z',
      size: '1.8 MB',
      downloadUrl: '/reports/detailed-analysis.xlsx'
    },
    {
      id: '3',
      name: 'Compliance Report',
      type: 'custom',
      format: 'pdf',
      status: 'generating',
      createdAt: '2024-01-16T09:00:00Z',
      size: 'Generating...'
    }
  ]

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'executive',
      name: 'Executive Summary',
      description: 'High-level overview for stakeholders and decision makers',
      category: 'executive',
      fields: ['test_summary', 'key_metrics', 'recommendations', 'roi_analysis'],
      format: ['pdf', 'excel'],
      icon: <Target className="h-5 w-5" />
    },
    {
      id: 'technical',
      name: 'Technical Analysis',
      description: 'Detailed statistical analysis and methodology',
      category: 'technical',
      fields: ['statistical_analysis', 'methodology', 'data_quality', 'assumptions'],
      format: ['pdf', 'excel', 'csv'],
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'Regulatory compliance and audit trail',
      category: 'compliance',
      fields: ['compliance_status', 'audit_trail', 'data_protection', 'consent_records'],
      format: ['pdf', 'excel'],
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'performance',
      name: 'Performance Dashboard',
      description: 'Real-time performance metrics and KPIs',
      category: 'custom',
      fields: ['kpis', 'trends', 'benchmarks', 'forecasts'],
      format: ['excel', 'csv', 'json'],
      icon: <TrendingUp className="h-5 w-5" />
    }
  ]

  useEffect(() => {
    setReports(sampleReports)
  }, [])

  const generateReport = async (templateId: string, format: string) => {
    setIsGenerating(true)
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const newReport: Report = {
      id: Date.now().toString(),
      name: `${reportTemplates.find(t => t.id === templateId)?.name} - ${new Date().toLocaleDateString()}`,
      type: templateId as any,
      format: format as any,
      status: 'ready',
      createdAt: new Date().toISOString(),
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      downloadUrl: `/reports/${templateId}-${Date.now()}.${format}`
    }
    
    setReports(prev => [newReport, ...prev])
    onReportGenerated(newReport)
    setIsGenerating(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800'
      case 'generating': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FilePdf className="h-4 w-4" />
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />
      case 'csv': return <FileText className="h-4 w-4" />
      case 'json': return <FileJson className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'executive': return 'bg-blue-100 text-blue-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'compliance': return 'bg-green-100 text-green-800'
      case 'custom': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reporting & Export</h2>
          <p className="text-muted-foreground">Generate and export comprehensive reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setActiveTab('generate')}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-xs text-muted-foreground">
              <FileText className="h-3 w-3 inline mr-1" />
              Generated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'ready').length}
            </div>
            <div className="text-xs text-muted-foreground">
              <Download className="h-3 w-3 inline mr-1" />
              Available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Generating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'generating').length}
            </div>
            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              In Progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3 vs last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your latest generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 5).map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFormatIcon(report.format)}
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()} • {report.size}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      {report.status === 'ready' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common reporting tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Executive Summary</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Technical Analysis</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <Target className="h-5 w-5" />
                  <span className="text-xs">Compliance Report</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col space-y-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Performance Dashboard</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          {/* Report Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>Create a custom report with your preferred settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(template.id)}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          {template.icon}
                          <div className="font-medium">{template.name}</div>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.slice(0, 3).map(field => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field.replace('_', ' ')}
                            </Badge>
                          ))}
                          {template.fields.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {template.format.map(format => (
                            <Button
                              key={format}
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                generateReport(template.id, format)
                              }}
                              disabled={isGenerating}
                            >
                              {getFormatIcon(format)}
                              <span className="ml-1 capitalize">{format}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Reports List */}
          <div className="space-y-4">
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFormatIcon(report.format)}
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()} • {report.size}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      {report.status === 'ready' && (
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Report Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTemplates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {template.icon}
                    <span>{template.name}</span>
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Included Fields</div>
                    <div className="flex flex-wrap gap-1">
                      {template.fields.map(field => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {field.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Available Formats</div>
                    <div className="flex space-x-1">
                      {template.format.map(format => (
                        <Badge key={format} className="bg-blue-100 text-blue-800">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      Customize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>Configure default report settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Default Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Auto-generate Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate reports when tests complete
                  </p>
                </div>
                
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications when reports are ready
                  </p>
                </div>
                
                <div>
                  <Label>Data Retention</Label>
                  <Select defaultValue="90">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
