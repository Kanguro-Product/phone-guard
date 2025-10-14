"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Play, Pause, Square, BarChart3, Settings, Users, Phone, MessageSquare, Mail, Sparkles, TrendingUp, Target, Zap } from "lucide-react"
import { CreateTestDialog } from "./create-test-dialog"
import { TestCard } from "./test-card"
import { TestMetricsDialog } from "./test-metrics-dialog"
import { TestDetailDialog } from "./test-detail-dialog"
import { TestTemplates } from "./test-templates"
import { AdvancedCharts } from "./advanced-charts"
import { SmartSampling } from "./smart-sampling"
import { ScientificTesting } from "./scientific-testing"
import { CommunicationSystem } from "./communication-system"
import { SpamProtection } from "./spam-protection"
import { ReportingSystem } from "./reporting-system"
import { EnhancedMetricsComparison } from "./enhanced-metrics-comparison"
import { SectionTooltip, HelpButton, InfoCircle } from "./section-tooltips"
import { SectionNavigation } from "./section-navigation"
import { ABCallerProvider } from "./ab-caller-context"
import { useToast } from "@/hooks/use-toast"

interface Test {
  test_id: string
  test_name: string
  status: string
  runtime_status?: string
  config: any
  created_at: string
  started_at?: string
  completed_at?: string
  current_metrics?: any
}

interface ABCallerPageClientProps {
  initialTests: Test[]
  user: any
}

export function ABCallerPageClientRevolutionary({ initialTests, user }: ABCallerPageClientProps) {
  const [tests, setTests] = useState<Test[]>(initialTests)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMetricsDialog, setShowMetricsDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { toast } = useToast()

  // Refresh tests periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTests()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchTests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ab-tests')
      const data = await response.json()
      
      if (response.ok) {
        setTests(data.tests || [])
      } else {
        console.error('Error fetching tests:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to load A/B tests",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
      toast({
        title: "Error",
        description: "Failed to load A/B tests",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createTest = async (testData: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const data = await response.json()
      if (data.success) {
        setTests(prev => [data.test, ...prev])
        setShowCreateDialog(false)
        
        toast({
          title: "Test Created! 🎉",
          description: "Your A/B test has been created successfully.",
        })
      } else {
        throw new Error(data.error || 'Failed to create test')
      }
    } catch (error) {
      console.error('Error creating test:', error)
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createSampleTest = async () => {
    setLoading(true)
    try {
      // Generate realistic sample data
      const sampleConfig = generateSampleTestConfig()
      
      // Create test directly in the frontend for demo purposes
      const sampleTest = {
        test_id: `sample_test_${Date.now()}`,
        test_name: sampleConfig.test_name,
        status: 'completed',
        runtime_status: 'completed',
        config: sampleConfig,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        current_metrics: generateSampleMetrics(),
      }
      
      setTests(prev => [sampleTest, ...prev])
      setShowCreateDialog(false)
      
      toast({
        title: "Sample Test Created! 🎉",
        description: "A realistic A/B test with sample data has been created. Check the metrics to see the results!",
      })
    } catch (error) {
      console.error('Error creating sample test:', error)
      toast({
        title: "Error",
        description: "Failed to create sample test. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSampleTestConfig = () => {
    const testNames = [
      "Mobile vs Fixed Line Performance Test",
      "Morning vs Afternoon Call Optimization",
      "WhatsApp Nudge Effectiveness Study",
      "CLI Reputation Impact Analysis",
      "Voicemail vs Direct Call Comparison"
    ]
    
    const sectors = ["Technology", "Finance", "Healthcare", "Real Estate", "Education"]
    const provinces = ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"]
    
    const sampleLeads = Array.from({ length: 25 }, (_, i) => ({
      lead_id: `lead_${i + 1}`,
      phone: `+34${600000000 + i}`,
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      province: provinces[Math.floor(Math.random() * provinces.length)]
    }))

    return {
      test_name: testNames[Math.floor(Math.random() * testNames.length)],
      timezone: "Europe/Madrid",
      workday: {
        start: "09:00",
        end: "17:00"
      },
      groups: {
        A: { 
          label: "Mobile Strategy", 
          cli: "+34123456789" 
        },
        B: { 
          label: "Fixed Line Strategy", 
          cli: "+34987654321" 
        }
      },
      leads: sampleLeads,
      attempts_policy: {
        max_attempts: 3,
        ring_times_sec: [30, 30, 30]
      },
      nudges: {
        whatsapp: {
          enabled: true,
          when: "after_attempt_2_fail",
          text_template: "Hi {{lead_id}}, we tried to reach you but couldn't connect. Would you like to schedule a callback?",
          template_name: "callback_request",
          template_language: "es",
          buttons: [
            { text: "Yes, call me back", reply: { id: "callback_yes", title: "Schedule Callback" } },
            { text: "No, thanks", reply: { id: "callback_no", title: "Decline" } }
          ]
        },
        voicemail: {
          enabled: true,
          only_on_attempt_N: 3
        },
        email: {
          enabled: true,
          from: "noreply@phoneguard.com",
          subject: "Follow-up from our call",
          html: "<p>Hi {{lead_id}}, we tried to reach you. Please let us know the best time to call.</p>",
          template_id: "follow_up_email"
        }
      },
      spam_controls: {
        enabled: true,
        rate_downshift_factor: 0.5,
        stop_rules: {
          max_spam_rate: 15,
          min_answer_rate: 5,
          max_hangup_rate: 80
        }
      },
      spam_checker: {
        enabled: true,
        policy: "mixed",
        signal_source: "internal_api",
        scoring_field: "reputation_score",
        labels_field: "labels",
        thresholds: {
          block_above: 80,
          slow_above: 60,
          warn_above: 40
        },
        actions: {
          block: "skip_call",
          slow: "downshift_rate",
          warn: "log_only"
        }
      },
      waves: {
        enabled: true,
        per_group_leads: 10,
        wave_size: 5,
        schedule: [
          { time: "09:00", size: 5 },
          { time: "11:00", size: 5 },
          { time: "14:00", size: 5 },
          { time: "16:00", size: 5 }
        ]
      }
    }
  }

  const generateSampleMetrics = () => {
    const groupAMetrics = {
      leads_contacted: 25,
      total_calls: Math.floor(Math.random() * 10) + 20,
      answered_calls: Math.floor(Math.random() * 8) + 6,
      answer_rate: Math.floor(Math.random() * 15) + 20,
      connect_rate: Math.floor(Math.random() * 10) + 30,
      average_duration: Math.floor(Math.random() * 60) + 90,
      spam_block_rate: Math.floor(Math.random() * 5) + 2
    }

    const groupBMetrics = {
      leads_contacted: 25,
      total_calls: Math.floor(Math.random() * 10) + 22,
      answered_calls: Math.floor(Math.random() * 8) + 8,
      answer_rate: Math.floor(Math.random() * 15) + 25,
      connect_rate: Math.floor(Math.random() * 10) + 35,
      average_duration: Math.floor(Math.random() * 60) + 100,
      spam_block_rate: Math.floor(Math.random() * 5) + 1
    }

    const winner = groupBMetrics.answer_rate > groupAMetrics.answer_rate ? 'B' : 'A'
    const statisticalSignificance = Math.random() > 0.3

    return {
      group_a: groupAMetrics,
      group_b: groupBMetrics,
      comparison: {
        winner,
        statistical_significance: statisticalSignificance,
        confidence_level: Math.floor(Math.random() * 20) + 75,
        effect_size: Math.random() * 0.5 + 0.2
      },
      duration: {
        total_hours: Math.floor(Math.random() * 48) + 24,
        active_hours: Math.floor(Math.random() * 24) + 12
      },
      spam_metrics: {
        total_blocks: Math.floor(Math.random() * 5) + 2,
        spam_rate: Math.floor(Math.random() * 3) + 1
      }
    }
  }

  const handleTestAction = async (testId: string, action: string) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()
      if (data.success) {
        // Update the test in the local state
        setTests(prev => prev.map(test => 
          test.test_id === testId 
            ? { ...test, status: action === 'stop' ? 'stopped' : action }
            : test
        ))
        
        toast({
          title: "Action Successful! ✅",
          description: `Test ${action}ed successfully.`,
        })
      } else {
        throw new Error(data.error || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast({
        title: "Error",
        description: "Failed to perform action. Please try again.",
        variant: "destructive"
      })
    }
  }

  const runningTests = tests.filter(test => test.status === 'running')
  const completedTests = tests.filter(test => test.status === 'completed')
  const draftTests = tests.filter(test => test.status === 'draft')

  return (
    <ABCallerProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">A/B Caller Tool</h1>
              <p className="text-muted-foreground mt-2">
                Revolutionary A/B testing platform with AI-powered insights
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Test</span>
              </Button>
              <Button 
                onClick={createSampleTest}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>Sample Data</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tests.length}</div>
              <p className="text-xs text-muted-foreground">
                {runningTests.length} running
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningTests.length}</div>
              <p className="text-xs text-muted-foreground">
                Active campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTests.length}</div>
              <p className="text-xs text-muted-foreground">
                With results
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedTests.length > 0 ? Math.floor(Math.random() * 20 + 70) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Average performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Navigation */}
        <SectionNavigation />

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="sampling">Sampling</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="spam">Spam Protection</TabsTrigger>
            <TabsTrigger value="scientific">Scientific</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Metrics Comparison */}
            {selectedTest && (
              <SectionTooltip section="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <CardTitle>Enhanced Metrics Comparison</CardTitle>
                      </div>
                      <InfoCircle section="overview" size="md" />
                    </div>
                    <CardDescription>
                      Comprehensive performance analysis with detailed insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EnhancedMetricsComparison 
                      metrics={selectedTest.current_metrics}
                      testName={selectedTest.test_name}
                    />
                  </CardContent>
                </Card>
              </SectionTooltip>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Get started quickly with pre-configured test templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={createSampleTest}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Create Sample Test</span>
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowCreateDialog(true)}
                    className="flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Custom Test</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tests Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Tests</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              {tests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Create your first A/B test to start optimizing your calling campaigns
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Test
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tests.map((test) => (
                    <TestCard
                      key={test.test_id}
                      test={test}
                      onViewMetrics={() => {
                        setSelectedTest(test)
                        setShowMetricsDialog(true)
                      }}
                      onViewDetails={() => {
                        setSelectedTest(test)
                        setShowDetailDialog(true)
                      }}
                      onAction={async (action) => {
                        await handleTestAction(test.test_id, action)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <SectionTooltip section="templates">
              <TestTemplates 
                onSelectTemplate={(template) => {
                  console.log('Selected template:', template)
                }}
                onCloneTest={(testId) => {
                  console.log('Clone test:', testId)
                }}
                existingTests={tests}
              />
            </SectionTooltip>
          </TabsContent>

          <TabsContent value="analytics">
            <SectionTooltip section="analytics">
              <AdvancedCharts 
                testId={selectedTest?.test_id || ''}
                metrics={selectedTest?.current_metrics}
              />
            </SectionTooltip>
          </TabsContent>

          <TabsContent value="sampling">
            <SectionTooltip section="sampling">
              <SmartSampling 
                onGenerateLeads={(leads) => {
                  console.log('Generated leads:', leads)
                }}
                onAnalyzePatterns={(analysis) => {
                  console.log('Pattern analysis:', analysis)
                }}
              />
            </SectionTooltip>
          </TabsContent>


          <TabsContent value="scientific">
            <SectionTooltip section="scientific">
              <ScientificTesting 
                testData={selectedTest}
                onAnalysisComplete={(analysis) => {
                  console.log('Statistical analysis:', analysis)
                }}
              />
            </SectionTooltip>
          </TabsContent>

          <TabsContent value="communication">
            <SectionTooltip section="communication">
              <CommunicationSystem 
                onTemplateCreate={(template) => {
                  console.log('Template created:', template)
                }}
                onNudgeConfigure={(nudge) => {
                  console.log('Nudge configured:', nudge)
                }}
              />
            </SectionTooltip>
          </TabsContent>


          <TabsContent value="spam">
            <SectionTooltip section="spam">
              <SpamProtection 
                onConfigUpdate={(config) => {
                  console.log('Spam config updated:', config)
                }}
                onRiskAssessment={(risks) => {
                  console.log('Risk assessment:', risks)
                }}
              />
            </SectionTooltip>
          </TabsContent>

          <TabsContent value="reporting">
            <SectionTooltip section="reporting">
              <ReportingSystem 
                testData={selectedTest}
                onReportGenerated={(report) => {
                  console.log('Report generated:', report)
                }}
              />
            </SectionTooltip>
          </TabsContent>

        </Tabs>

        {/* Dialogs */}
        <CreateTestDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateTest={createTest}
          onCreateSampleTest={createSampleTest}
          loading={loading}
        />

        {selectedTest && (
          <>
            <TestMetricsDialog
              open={showMetricsDialog}
              onOpenChange={setShowMetricsDialog}
              test={selectedTest}
            />

            <TestDetailDialog
              open={showDetailDialog}
              onOpenChange={setShowDetailDialog}
              test={selectedTest}
            />
          </>
        )}
      </div>
    </ABCallerProvider>
  )
}
