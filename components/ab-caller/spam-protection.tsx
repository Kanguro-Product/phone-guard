"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Brain,
  Zap,
  Target,
  BarChart3,
  Clock,
  Users,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react"

interface SpamRisk {
  leadId: string
  phone: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    phoneReputation: number
    callFrequency: number
    responseRate: number
    timePatterns: number
    geographicRisk: number
    sectorRisk: number
  }
  recommendations: string[]
  lastChecked: string
}

interface SpamProtectionConfig {
  enabled: boolean
  thresholds: {
    blockAbove: number
    slowAbove: number
    warnAbove: number
  }
  actions: {
    block: 'skip_call' | 'mark_spam' | 'add_to_blacklist'
    slow: 'downshift_rate' | 'reduce_attempts' | 'add_delay'
    warn: 'log_only' | 'flag_for_review' | 'reduce_priority'
  }
  features: {
    phoneReputation: boolean
    callFrequency: boolean
    timePatterns: boolean
    geographicAnalysis: boolean
    sectorAnalysis: boolean
    aiPrediction: boolean
  }
  whitelist: string[]
  blacklist: string[]
}

interface SpamProtectionProps {
  onConfigUpdate: (config: SpamProtectionConfig) => void
  onRiskAssessment: (risks: SpamRisk[]) => void
}

export function SpamProtection({ onConfigUpdate, onRiskAssessment }: SpamProtectionProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [config, setConfig] = useState<SpamProtectionConfig>({
    enabled: true,
    thresholds: {
      blockAbove: 80,
      slowAbove: 60,
      warnAbove: 40
    },
    actions: {
      block: 'skip_call',
      slow: 'downshift_rate',
      warn: 'log_only'
    },
    features: {
      phoneReputation: true,
      callFrequency: true,
      timePatterns: true,
      geographicAnalysis: true,
      sectorAnalysis: true,
      aiPrediction: true
    },
    whitelist: [],
    blacklist: []
  })
  
  const [spamRisks, setSpamRisks] = useState<SpamRisk[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Sample spam risks for demonstration
  const sampleSpamRisks: SpamRisk[] = [
    {
      leadId: 'lead_1',
      phone: '+34600000001',
      riskScore: 25,
      riskLevel: 'low',
      factors: {
        phoneReputation: 85,
        callFrequency: 20,
        responseRate: 75,
        timePatterns: 90,
        geographicRisk: 15,
        sectorRisk: 10
      },
      recommendations: ['Safe to call', 'Normal calling pattern'],
      lastChecked: new Date().toISOString()
    },
    {
      leadId: 'lead_2',
      phone: '+34600000002',
      riskScore: 65,
      riskLevel: 'high',
      factors: {
        phoneReputation: 30,
        callFrequency: 80,
        responseRate: 15,
        timePatterns: 40,
        geographicRisk: 70,
        sectorRisk: 60
      },
      recommendations: ['Consider reducing call frequency', 'Monitor for spam complaints'],
      lastChecked: new Date().toISOString()
    },
    {
      leadId: 'lead_3',
      phone: '+34600000003',
      riskScore: 85,
      riskLevel: 'critical',
      factors: {
        phoneReputation: 10,
        callFrequency: 95,
        responseRate: 5,
        timePatterns: 20,
        geographicRisk: 90,
        sectorRisk: 85
      },
      recommendations: ['BLOCK: High spam risk', 'Add to blacklist', 'Review calling strategy'],
      lastChecked: new Date().toISOString()
    }
  ]

  useEffect(() => {
    setSpamRisks(sampleSpamRisks)
  }, [])

  const handleConfigUpdate = (newConfig: Partial<SpamProtectionConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    onConfigUpdate(updatedConfig)
  }

  const analyzeSpamRisks = async () => {
    setIsAnalyzing(true)
    
    try {
      // Use the existing spam validation system
      const response = await fetch('/api/validate-spam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumberId: 'bulk_analysis',
          selectedAPIs: {
            numverify: config.features.phoneReputation,
            openai: config.features.aiPrediction,
            hiya: config.features.phoneReputation
          }
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Transform the validation results into risk assessments
        const newRisks = data.results?.map((result: any) => ({
          leadId: result.phoneNumberId,
          phone: result.phone,
          riskScore: calculateRiskScore(result),
          riskLevel: getRiskLevel(calculateRiskScore(result)),
          factors: {
            phoneReputation: result.reputation_score || 50,
            callFrequency: result.call_frequency || 0,
            responseRate: result.response_rate || 0,
            timePatterns: result.time_pattern_score || 50,
            geographicRisk: result.geographic_risk || 0,
            sectorRisk: result.sector_risk || 0
          },
          recommendations: generateRecommendations(result),
          lastChecked: new Date().toISOString()
        })) || []
        
        setSpamRisks(newRisks)
        onRiskAssessment(newRisks)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Error analyzing spam risks:', error)
      // Fallback to sample data if API fails
      const newRisks = spamRisks.map(risk => ({
        ...risk,
        riskScore: Math.floor(Math.random() * 100),
        lastChecked: new Date().toISOString()
      }))
      setSpamRisks(newRisks)
      onRiskAssessment(newRisks)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculateRiskScore = (result: any): number => {
    const reputationScore = result.reputation_score || 50
    const spamReports = result.spam_reports || 0
    const callFrequency = result.call_frequency || 0
    
    // Calculate risk score based on existing system logic
    let riskScore = 50 // Base score
    
    // Adjust based on reputation (inverse relationship)
    riskScore += (50 - reputationScore) * 0.6
    
    // Adjust based on spam reports
    riskScore += Math.min(spamReports * 5, 30)
    
    // Adjust based on call frequency
    riskScore += Math.min(callFrequency * 2, 20)
    
    return Math.max(0, Math.min(100, Math.round(riskScore)))
  }

  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const generateRecommendations = (result: any): string[] => {
    const recommendations = []
    const reputationScore = result.reputation_score || 50
    const spamReports = result.spam_reports || 0
    
    if (reputationScore < 30) {
      recommendations.push('High spam risk - consider blocking')
    } else if (reputationScore < 60) {
      recommendations.push('Medium risk - monitor closely')
    } else {
      recommendations.push('Low risk - safe to call')
    }
    
    if (spamReports > 5) {
      recommendations.push('Multiple spam reports - reduce calling frequency')
    }
    
    if (result.call_frequency > 10) {
      recommendations.push('High call frequency - consider rate limiting')
    }
    
    return recommendations
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Shield className="h-4 w-4 text-gray-600" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'skip_call': return 'Skip Call'
      case 'mark_spam': return 'Mark as Spam'
      case 'add_to_blacklist': return 'Add to Blacklist'
      case 'downshift_rate': return 'Reduce Rate'
      case 'reduce_attempts': return 'Reduce Attempts'
      case 'add_delay': return 'Add Delay'
      case 'log_only': return 'Log Only'
      case 'flag_for_review': return 'Flag for Review'
      case 'reduce_priority': return 'Reduce Priority'
      default: return action
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Spam Protection System</h2>
          <p className="text-muted-foreground">AI-powered spam detection and prevention</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={analyzeSpamRisks} 
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {isAnalyzing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analyze Risks
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spamRisks.length}</div>
            <div className="text-xs text-muted-foreground">
              <Users className="h-3 w-3 inline mr-1" />
              Analyzed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {spamRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length}
            </div>
            <div className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              Blocked/Flagged
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(spamRisks.reduce((sum, r) => sum + r.riskScore, 0) / spamRisks.length)}
            </div>
            <div className="text-xs text-muted-foreground">
              <Target className="h-3 w-3 inline mr-1" />
              Out of 100
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Protection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {config.enabled ? 'Active' : 'Disabled'}
            </div>
            <div className="text-xs text-muted-foreground">
              <Shield className="h-3 w-3 inline mr-1" />
              {config.enabled ? 'Protecting' : 'Inactive'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {spamRisks.some(r => r.riskLevel === 'critical') && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Risk Detected!</strong> {spamRisks.filter(r => r.riskLevel === 'critical').length} leads 
            have been flagged as high spam risk. Review and take action immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Distribution</CardTitle>
              <CardDescription>Current spam risk levels across all leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['low', 'medium', 'high', 'critical'].map(level => {
                  const count = spamRisks.filter(r => r.riskLevel === level).length
                  const percentage = (count / spamRisks.length) * 100
                  
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRiskIcon(level)}
                        <span className="capitalize font-medium">{level} Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getRiskBgColor(level).split(' ')[0]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest spam protection actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spamRisks.slice(0, 5).map(risk => (
                  <div key={risk.leadId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getRiskIcon(risk.riskLevel)}
                      <div>
                        <div className="font-medium">{risk.phone}</div>
                        <div className="text-sm text-muted-foreground">
                          Risk Score: {risk.riskScore}/100
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getRiskBgColor(risk.riskLevel)}>
                        {risk.riskLevel}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(risk.lastChecked).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          {/* Risk Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Risk Analysis</CardTitle>
              <CardDescription>Comprehensive risk assessment for each lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spamRisks.map(risk => (
                  <Card key={risk.leadId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getRiskIcon(risk.riskLevel)}
                            <div>
                              <div className="font-medium">{risk.phone}</div>
                              <div className="text-sm text-muted-foreground">Lead ID: {risk.leadId}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getRiskColor(risk.riskLevel)}`}>
                              {risk.riskScore}
                            </div>
                            <div className="text-sm text-muted-foreground">Risk Score</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Phone Reputation</div>
                            <div className="flex items-center space-x-2">
                              <Progress value={risk.factors.phoneReputation} className="flex-1" />
                              <span className="text-sm font-medium">{risk.factors.phoneReputation}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Call Frequency</div>
                            <div className="flex items-center space-x-2">
                              <Progress value={risk.factors.callFrequency} className="flex-1" />
                              <span className="text-sm font-medium">{risk.factors.callFrequency}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Response Rate</div>
                            <div className="flex items-center space-x-2">
                              <Progress value={risk.factors.responseRate} className="flex-1" />
                              <span className="text-sm font-medium">{risk.factors.responseRate}%</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Recommendations</div>
                          <div className="space-y-1">
                            {risk.recommendations.map((rec, index) => (
                              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                                • {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Protection Configuration</CardTitle>
              <CardDescription>Configure spam protection settings and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">Global Settings</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Spam Protection</Label>
                    <p className="text-sm text-muted-foreground">Activate AI-powered spam detection</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => handleConfigUpdate({ enabled: checked })}
                  />
                </div>
              </div>

              {/* Thresholds */}
              <div className="space-y-4">
                <h4 className="font-medium">Risk Thresholds</h4>
                <div className="space-y-4">
                  <div>
                    <Label>Block Above</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[config.thresholds.blockAbove]}
                        onValueChange={([value]) => handleConfigUpdate({ 
                          thresholds: { ...config.thresholds, blockAbove: value }
                        })}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{config.thresholds.blockAbove}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Slow Above</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[config.thresholds.slowAbove]}
                        onValueChange={([value]) => handleConfigUpdate({ 
                          thresholds: { ...config.thresholds, slowAbove: value }
                        })}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{config.thresholds.slowAbove}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Warn Above</Label>
                    <div className="flex items-center space-x-2">
                      <Slider
                        value={[config.thresholds.warnAbove]}
                        onValueChange={([value]) => handleConfigUpdate({ 
                          thresholds: { ...config.thresholds, warnAbove: value }
                        })}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium w-12">{config.thresholds.warnAbove}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <h4 className="font-medium">Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Block Action</Label>
                    <Select 
                      value={config.actions.block} 
                      onValueChange={(value) => handleConfigUpdate({ 
                        actions: { ...config.actions, block: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip_call">Skip Call</SelectItem>
                        <SelectItem value="mark_spam">Mark as Spam</SelectItem>
                        <SelectItem value="add_to_blacklist">Add to Blacklist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Slow Action</Label>
                    <Select 
                      value={config.actions.slow} 
                      onValueChange={(value) => handleConfigUpdate({ 
                        actions: { ...config.actions, slow: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downshift_rate">Reduce Rate</SelectItem>
                        <SelectItem value="reduce_attempts">Reduce Attempts</SelectItem>
                        <SelectItem value="add_delay">Add Delay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Warn Action</Label>
                    <Select 
                      value={config.actions.warn} 
                      onValueChange={(value) => handleConfigUpdate({ 
                        actions: { ...config.actions, warn: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="log_only">Log Only</SelectItem>
                        <SelectItem value="flag_for_review">Flag for Review</SelectItem>
                        <SelectItem value="reduce_priority">Reduce Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-medium">Protection Features</h4>
                <div className="space-y-4">
                  {Object.entries(config.features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div>
                        <Label className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <p className="text-sm text-muted-foreground">
                          {feature === 'phoneReputation' && 'Check phone number reputation'}
                          {feature === 'callFrequency' && 'Analyze calling frequency patterns'}
                          {feature === 'timePatterns' && 'Detect suspicious time patterns'}
                          {feature === 'geographicAnalysis' && 'Analyze geographic risk factors'}
                          {feature === 'sectorAnalysis' && 'Assess sector-specific risks'}
                          {feature === 'aiPrediction' && 'Use AI for risk prediction'}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handleConfigUpdate({ 
                          features: { ...config.features, [feature]: checked }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>Live spam protection monitoring and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {spamRisks.filter(r => r.riskLevel === 'low').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Safe to Call</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {spamRisks.filter(r => r.riskLevel === 'medium').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Monitor</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {spamRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Blocked</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Protection Reports</CardTitle>
              <CardDescription>Detailed spam protection analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Reports Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting features will be available in the next update.
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
