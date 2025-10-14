"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts'
import { 
  Tooltip as UITooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Users, 
  Phone,
  MessageSquare,
  Mail,
  Shield,
  Zap,
  Download,
  RefreshCw,
  Info
} from "lucide-react"

interface ChartData {
  name: string
  groupA: number
  groupB: number
  difference: number
  significance: boolean
}

interface AdvancedChartsProps {
  testId: string
  metrics: any
  realTimeData?: any[]
}

export function AdvancedCharts({ testId, metrics, realTimeData = [] }: AdvancedChartsProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('24h')

  // Generate sample data for demonstration
  const generateSampleData = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      groupA: Math.floor(Math.random() * 20) + 10,
      groupB: Math.floor(Math.random() * 20) + 10,
      total: 0
    }))
    
    return hours.map(h => ({
      ...h,
      total: h.groupA + h.groupB,
      difference: h.groupA - h.groupB
    }))
  }

  const hourlyData = generateSampleData()

  const funnelData = [
    { stage: 'Leads', groupA: metrics?.group_a?.leads_contacted || 100, groupB: metrics?.group_b?.leads_contacted || 100 },
    { stage: 'Calls Made', groupA: metrics?.group_a?.total_calls || 80, groupB: metrics?.group_b?.total_calls || 85 },
    { stage: 'Answered', groupA: metrics?.group_a?.answered_calls || 25, groupB: metrics?.group_b?.answered_calls || 30 },
    { stage: 'Qualified', groupA: Math.floor((metrics?.group_a?.answered_calls || 25) * 0.6), groupB: Math.floor((metrics?.group_b?.answered_calls || 30) * 0.7) },
    { stage: 'Converted', groupA: Math.floor((metrics?.group_a?.answered_calls || 25) * 0.3), groupB: Math.floor((metrics?.group_b?.answered_calls || 30) * 0.4) }
  ]

  // Ensure funnel data has valid values and generate sample data if needed
  const safeFunnelData = funnelData.map(item => ({
    ...item,
    groupA: Math.max(0, item.groupA || 0),
    groupB: Math.max(0, item.groupB || 0)
  }))

  // If no data is available, generate sample data
  const finalFunnelData = safeFunnelData.some(item => item.groupA === 0 && item.groupB === 0) 
    ? [
        { stage: 'Leads', groupA: 100, groupB: 100 },
        { stage: 'Calls Made', groupA: 80, groupB: 85 },
        { stage: 'Answered', groupA: 25, groupB: 30 },
        { stage: 'Qualified', groupA: 15, groupB: 21 },
        { stage: 'Converted', groupA: 8, groupB: 12 }
      ]
    : safeFunnelData

  // Debug: Log funnel data
  console.log('Funnel Data:', finalFunnelData)

  const performanceData = [
    { metric: 'Answer Rate', groupA: metrics?.group_a?.answer_rate || 25, groupB: metrics?.group_b?.answer_rate || 30, unit: '%' },
    { metric: 'Connect Rate', groupA: metrics?.group_a?.connect_rate || 35, groupB: metrics?.group_b?.connect_rate || 40, unit: '%' },
    { metric: 'Avg Duration', groupA: metrics?.group_a?.average_duration || 120, groupB: metrics?.group_b?.average_duration || 135, unit: 's' },
    { metric: 'Spam Rate', groupA: metrics?.group_a?.spam_block_rate || 5, groupB: metrics?.group_b?.spam_block_rate || 3, unit: '%' }
  ]

  // Enhanced data insights for better decision making
  const dataInsights = {
    // Performance comparison
    performanceGap: (metrics?.group_b?.answer_rate || 30) - (metrics?.group_a?.answer_rate || 25),
    improvementPercentage: ((metrics?.group_b?.answer_rate || 30) - (metrics?.group_a?.answer_rate || 25)) / (metrics?.group_a?.answer_rate || 25) * 100,
    
    // Cost efficiency
    costSavings: (metrics?.group_a?.cost_per_call || 2.5) - (metrics?.group_b?.cost_per_call || 2.8),
    roiImprovement: ((metrics?.group_b?.conversion_rate || 15) - (metrics?.group_a?.conversion_rate || 12)) / (metrics?.group_a?.conversion_rate || 12) * 100,
    
    // Quality metrics
    spamRisk: metrics?.spam_score || 0,
    qualityScore: metrics?.quality_score || 0,
    complianceRate: metrics?.compliance_rate || 0,
    
    // Statistical significance
    pValue: metrics?.p_value || 0,
    confidenceLevel: metrics?.confidence_level || 0,
    statisticalPower: metrics?.statistical_power || 0,
    
    // Time-based insights
    peakHours: metrics?.peak_hours || [],
    lowPerformanceHours: metrics?.low_performance_hours || [],
    seasonalTrends: metrics?.seasonal_trends || [],
    
    // Segment analysis
    bestPerformingSegment: metrics?.best_performing_segment || 'Unknown',
    worstPerformingSegment: metrics?.worst_performing_segment || 'Unknown',
    segmentVariance: metrics?.segment_variance || 0
  }

  const geographicData = [
    { province: 'Madrid', groupA: 45, groupB: 50, total: 95 },
    { province: 'Barcelona', groupA: 38, groupB: 42, total: 80 },
    { province: 'Valencia', groupA: 25, groupB: 28, total: 53 },
    { province: 'Sevilla', groupA: 18, groupB: 22, total: 40 },
    { province: 'Bilbao', groupA: 15, groupB: 18, total: 33 }
  ]

  const sectorData = [
    { name: 'Technology', value: 35, color: '#8884d8' },
    { name: 'Finance', value: 25, color: '#82ca9d' },
    { name: 'Healthcare', value: 20, color: '#ffc658' },
    { name: 'Real Estate', value: 15, color: '#ff7300' },
    { name: 'Education', value: 5, color: '#00ff00' }
  ]

  const timelineData = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    groupA: Math.floor(Math.random() * 50) + 20,
    groupB: Math.floor(Math.random() * 50) + 25,
    cumulativeA: (i + 1) * 15 + Math.floor(Math.random() * 20),
    cumulativeB: (i + 1) * 18 + Math.floor(Math.random() * 25)
  }))

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-help h-5 w-5">
                  <Info className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">Advanced Analytics</h4>
                    <p className="text-sm text-muted-foreground mt-1">Comprehensive analytics with detailed metrics, conversion funnels, geographic analysis, and performance insights.</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Data Sources:</p>
                    <p className="text-xs">Call logs, conversion tracking, geographic data, and performance metrics</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Key Features:</p>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Conversion funnel analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Geographic performance maps</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Timeline analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>Performance comparisons</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <div>
          <p className="text-muted-foreground">Comprehensive insights and visualizations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {['1h', '24h', '7d', '30d'].map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Main Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="insights">Data Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics?.group_a?.total_calls || 0) + (metrics?.group_b?.total_calls || 0)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs last test
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(((metrics?.group_a?.answer_rate || 0) + (metrics?.group_b?.answer_rate || 0)) / 2)}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Target className="h-3 w-3 mr-1" />
                  Industry avg: 22%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.comparison?.winner === 'A' ? 'Group A' : 
                   metrics?.comparison?.winner === 'B' ? 'Group B' : 'Tie'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  {metrics?.comparison?.statistical_significance ? 'Significant' : 'Not significant'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.comparison?.confidence_level || 85}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 mr-1" />
                  Statistical confidence
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="groupA" fill="#8884d8" name="Group A" />
                  <Bar dataKey="groupB" fill="#82ca9d" name="Group B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Performance</CardTitle>
              <CardDescription>Call performance throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="groupA" stroke="#8884d8" strokeWidth={2} name="Group A" />
                  <Line type="monotone" dataKey="groupB" stroke="#82ca9d" strokeWidth={2} name="Group B" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Answer Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="groupA" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="groupB" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Duration Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { duration: '0-30s', groupA: 15, groupB: 12 },
                    { duration: '30-60s', groupA: 25, groupB: 28 },
                    { duration: '1-2min', groupA: 35, groupB: 32 },
                    { duration: '2-5min', groupA: 20, groupB: 25 },
                    { duration: '5min+', groupA: 5, groupB: 3 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="duration" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="groupA" fill="#8884d8" name="Group A" />
                    <Bar dataKey="groupB" fill="#82ca9d" name="Group B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Lead progression through the funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={finalFunnelData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="groupA" fill="#8884d8" name="Group A" />
                  <Bar dataKey="groupB" fill="#82ca9d" name="Group B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Funnel Visualization</CardTitle>
              <CardDescription>Visual representation of conversion stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {finalFunnelData.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>Group A: {stage.groupA}</span>
                        <span>Group B: {stage.groupB}</span>
                      </div>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-l-lg"
                        style={{ width: `${(stage.groupA / Math.max(stage.groupA, stage.groupB)) * 50}%` }}
                      />
                      <div 
                        className="absolute top-0 right-0 h-full bg-green-500 rounded-r-lg"
                        style={{ width: `${(stage.groupB / Math.max(stage.groupA, stage.groupB)) * 50}%` }}
                      />
                    </div>
                    {index < finalFunnelData.length - 1 && (
                      <div className="flex justify-center mt-2">
                        <div className="w-0.5 h-4 bg-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="province" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="groupA" fill="#8884d8" name="Group A" />
                    <Bar dataKey="groupB" fill="#82ca9d" name="Group B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Sectors</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Data Insights Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Gap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  +{dataInsights.performanceGap.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Group B outperforms Group A by {dataInsights.improvementPercentage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${dataInsights.costSavings.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Cost savings per call
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ROI Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  +{dataInsights.roiImprovement.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Return on investment increase
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quality Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spam Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {dataInsights.spamRisk}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Current spam risk level
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dataInsights.qualityScore}/100
                </div>
                <p className="text-sm text-muted-foreground">
                  Overall quality assessment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dataInsights.complianceRate}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Regulatory compliance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistical Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
              <CardDescription>Statistical significance and confidence levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {dataInsights.pValue.toFixed(4)}
                  </div>
                  <p className="text-sm text-muted-foreground">P-Value</p>
                  <p className="text-xs text-muted-foreground">
                    {dataInsights.pValue < 0.05 ? 'Statistically significant' : 'Not significant'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {dataInsights.confidenceLevel}%
                  </div>
                  <p className="text-sm text-muted-foreground">Confidence Level</p>
                  <p className="text-xs text-muted-foreground">
                    Statistical confidence
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {dataInsights.statisticalPower}%
                  </div>
                  <p className="text-sm text-muted-foreground">Statistical Power</p>
                  <p className="text-xs text-muted-foreground">
                    Test sensitivity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Performance</CardTitle>
              <CardDescription>Best and worst performing segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">Best Performing</h4>
                  <p className="text-lg">{dataInsights.bestPerformingSegment}</p>
                  <p className="text-sm text-muted-foreground">
                    Highest conversion rate
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Worst Performing</h4>
                  <p className="text-lg">{dataInsights.worstPerformingSegment}</p>
                  <p className="text-sm text-muted-foreground">
                    Needs optimization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
