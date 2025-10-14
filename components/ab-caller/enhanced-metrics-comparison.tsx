"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  Phone, 
  Clock, 
  Users, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  MapPin,
  MessageSquare,
  Mail,
  Zap,
  Shield,
  Brain,
  Activity,
  Info
} from "lucide-react"

interface MetricsData {
  group_a: {
    total_calls: number
    answered_calls: number
    leads_contacted: number
    conversion_rate: number
    avg_call_duration: number
    peak_hours: string[]
    geographic_distribution: { [key: string]: number }
    channel_performance: {
      voice: number
      whatsapp: number
      email: number
      sms: number
    }
    spam_score: number
    quality_score: number
    cost_per_lead: number
    roi: number
  }
  group_b: {
    total_calls: number
    answered_calls: number
    leads_contacted: number
    conversion_rate: number
    avg_call_duration: number
    peak_hours: string[]
    geographic_distribution: { [key: string]: number }
    channel_performance: {
      voice: number
      whatsapp: number
      email: number
      sms: number
    }
    spam_score: number
    quality_score: number
    cost_per_lead: number
    roi: number
  }
}

interface EnhancedMetricsComparisonProps {
  metrics?: MetricsData
  testName?: string
}

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  improvement, 
  icon: Icon, 
  description, 
  dataSource 
}: {
  title: string
  value: string | number
  unit?: string
  improvement?: number
  icon: any
  description: string
  dataSource: string
}) => {
  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return "text-green-600"
    if (improvement < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (improvement < 0) return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {improvement !== undefined && (
            <div className={`flex items-center space-x-1 ${getImprovementColor(improvement)}`}>
              {getImprovementIcon(improvement)}
              <span className="text-sm font-medium">
                {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">
          {value}{unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help h-4 w-4">
                <Info className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">{title}</p>
                <p className="text-sm">{description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Data Source:</strong> {dataSource}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}

export function EnhancedMetricsComparison({ metrics, testName }: EnhancedMetricsComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview')

  // Generate sample data if no metrics provided
  const sampleMetrics: MetricsData = {
    group_a: {
      total_calls: 150,
      answered_calls: 45,
      leads_contacted: 120,
      conversion_rate: 30.0,
      avg_call_duration: 180,
      peak_hours: ['09:00-10:00', '14:00-15:00', '16:00-17:00'],
      geographic_distribution: { 'Madrid': 35, 'Barcelona': 28, 'Valencia': 15, 'Sevilla': 12, 'Other': 10 },
      channel_performance: { voice: 60, whatsapp: 25, email: 10, sms: 5 },
      spam_score: 15,
      quality_score: 78,
      cost_per_lead: 12.50,
      roi: 240
    },
    group_b: {
      total_calls: 160,
      answered_calls: 52,
      leads_contacted: 130,
      conversion_rate: 32.5,
      avg_call_duration: 195,
      peak_hours: ['10:00-11:00', '15:00-16:00', '17:00-18:00'],
      geographic_distribution: { 'Madrid': 38, 'Barcelona': 30, 'Valencia': 18, 'Sevilla': 8, 'Other': 6 },
      channel_performance: { voice: 55, whatsapp: 30, email: 12, sms: 3 },
      spam_score: 12,
      quality_score: 82,
      cost_per_lead: 11.80,
      roi: 285
    }
  }

  const data = metrics || sampleMetrics

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '0.0%'
    return `${value.toFixed(1)}%`
  }
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '€0.00'
    return `€${value.toFixed(2)}`
  }

  const calculateImprovement = (a: number | undefined | null, b: number | undefined | null) => {
    if (a === undefined || a === null || b === undefined || b === null || isNaN(a) || isNaN(b)) return 0
    if (a === 0) return 0
    return ((b - a) / a) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Metrics Comparison</h2>
          <p className="text-muted-foreground">
            Comprehensive performance analysis with detailed insights
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Real-time Data
        </Badge>
      </div>

      {/* Metric Categories */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'timing', label: 'Timing Analysis', icon: Clock },
          { id: 'geographic', label: 'Geographic', icon: MapPin },
          { id: 'channels', label: 'Channels', icon: MessageSquare },
          { id: 'quality', label: 'Quality & Spam', icon: Shield },
          { id: 'financial', label: 'Financial', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={selectedMetric === id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMetric(id)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Overview Metrics */}
      {selectedMetric === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Calls"
            value={data.group_b?.total_calls || 0}
            improvement={calculateImprovement(data.group_a?.total_calls || 0, data.group_b?.total_calls || 0)}
            icon={Phone}
            description="Total number of calls made across all channels and attempts during the test period."
            dataSource="Call logs and attempt tracking system"
          />
          <MetricCard
            title="Answer Rate"
            value={formatPercentage(
              data.group_b?.total_calls && data.group_b?.answered_calls 
                ? (data.group_b.answered_calls / data.group_b?.total_calls || 0) * 100 
                : 0
            )}
            improvement={calculateImprovement(
              data.group_a?.total_calls && data.group_a?.answered_calls 
                ? (data.group_a.answered_calls / data.group_a?.total_calls || 0) * 100 
                : 0,
              data.group_b?.total_calls && data.group_b?.answered_calls 
                ? (data.group_b.answered_calls / data.group_b?.total_calls || 0) * 100 
                : 0
            )}
            icon={CheckCircle}
            description="Percentage of calls that were answered by the recipient."
            dataSource="Voice API call outcome tracking"
          />
          <MetricCard
            title="Conversion Rate"
            value={formatPercentage(data.group_b?.conversion_rate || 0)}
            improvement={calculateImprovement(
              data.group_a?.conversion_rate || 0, 
              data.group_b?.conversion_rate || 0
            )}
            icon={Target}
            description="Percentage of leads that converted to successful outcomes."
            dataSource="Lead status tracking and conversion funnel analysis"
          />
          <MetricCard
            title="Avg Call Duration"
            value={formatDuration(data.group_b?.avg_call_duration || 0)}
            improvement={calculateImprovement(data.group_a?.avg_call_duration || 0, data.group_b?.avg_call_duration || 0)}
            icon={Clock}
            description="Average duration of answered calls in minutes and seconds."
            dataSource="Call duration logs from voice API"
          />
        </div>
      )}

      {/* Performance Metrics */}
      {selectedMetric === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Leads Contacted"
            value={data.group_b.leads_contacted}
            improvement={calculateImprovement(data.group_a.leads_contacted, data.group_b.leads_contacted)}
            icon={Users}
            description="Total number of unique leads that were successfully contacted."
            dataSource="Lead contact tracking and communication logs"
          />
          <MetricCard
            title="Quality Score"
            value={data.group_b.quality_score}
            improvement={calculateImprovement(data.group_a.quality_score, data.group_b.quality_score)}
            icon={Brain}
            description="Overall quality score based on lead engagement and response patterns."
            dataSource="Lead quality assessment algorithms"
          />
          <MetricCard
            title="ROI"
            value={formatCurrency(data.group_b?.roi || 0)}
            improvement={calculateImprovement(data.group_a?.roi || 0, data.group_b?.roi || 0)}
            icon={TrendingUp}
            description="Return on investment calculated from revenue vs costs."
            dataSource="Revenue tracking and financial attribution"
          />
        </div>
      )}

      {/* Timing Analysis */}
      {selectedMetric === 'timing' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Peak Performance Hours
              </CardTitle>
              <CardDescription>
                Hours with highest success rates and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Group A Peak Hours</h4>
                  <div className="space-y-1">
                    {(data.group_a?.peak_hours || []).map((hour, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{hour}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Group B Peak Hours</h4>
                  <div className="space-y-1">
                    {(data.group_b?.peak_hours || []).map((hour, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">{hour}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Geographic Distribution */}
      {selectedMetric === 'geographic' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Performance Distribution
            </CardTitle>
            <CardDescription>
              Performance metrics by geographic region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Group A Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(data.group_a?.geographic_distribution || {}).map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between">
                      <span className="text-sm">{region}</span>
                      <Badge variant="outline">{count} leads</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Group B Distribution</h4>
                <div className="space-y-2">
                  {Object.entries(data.group_b?.geographic_distribution || {}).map(([region, count]) => (
                    <div key={region} className="flex items-center justify-between">
                      <span className="text-sm">{region}</span>
                      <Badge variant="outline">{count} leads</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Performance */}
      {selectedMetric === 'channels' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Multi-Channel Performance
            </CardTitle>
            <CardDescription>
              Performance across different communication channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Group A Channels</h4>
                <div className="space-y-3">
                  {Object.entries(data.group_a?.channel_performance || {}).map(([channel, percentage]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {channel === 'voice' && <Phone className="h-4 w-4" />}
                        {channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                        {channel === 'email' && <Mail className="h-4 w-4" />}
                        {channel === 'sms' && <MessageSquare className="h-4 w-4" />}
                        <span className="text-sm capitalize">{channel}</span>
                      </div>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Group B Channels</h4>
                <div className="space-y-3">
                  {Object.entries(data.group_b?.channel_performance || {}).map(([channel, percentage]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {channel === 'voice' && <Phone className="h-4 w-4" />}
                        {channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                        {channel === 'email' && <Mail className="h-4 w-4" />}
                        {channel === 'sms' && <MessageSquare className="h-4 w-4" />}
                        <span className="text-sm capitalize">{channel}</span>
                      </div>
                      <Badge variant="outline">{percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality & Spam Metrics */}
      {selectedMetric === 'quality' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Spam Score"
            value={data.group_b.spam_score}
            improvement={calculateImprovement(data.group_a.spam_score, data.group_b.spam_score)}
            icon={Shield}
            description="Spam risk score based on phone number reputation and validation."
            dataSource="Internal spam checker and phone reputation APIs"
          />
          <MetricCard
            title="Quality Score"
            value={data.group_b.quality_score}
            improvement={calculateImprovement(data.group_a.quality_score, data.group_b.quality_score)}
            icon={Brain}
            description="Lead quality assessment based on engagement and response patterns."
            dataSource="Lead quality assessment algorithms"
          />
        </div>
      )}

      {/* Financial Metrics */}
      {selectedMetric === 'financial' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Cost per Lead"
            value={formatCurrency(data.group_b?.cost_per_lead || 0)}
            improvement={calculateImprovement(data.group_a?.cost_per_lead || 0, data.group_b?.cost_per_lead || 0)}
            icon={Target}
            description="Average cost to acquire each lead including all channel costs."
            dataSource="Cost tracking and lead attribution system"
          />
          <MetricCard
            title="ROI"
            value={formatCurrency(data.group_b?.roi || 0)}
            improvement={calculateImprovement(data.group_a?.roi || 0, data.group_b?.roi || 0)}
            icon={TrendingUp}
            description="Return on investment from revenue generated vs costs incurred."
            dataSource="Revenue tracking and financial attribution system"
          />
        </div>
      )}
    </div>
  )
}