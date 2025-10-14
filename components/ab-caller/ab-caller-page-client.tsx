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
import { Gamification } from "./gamification"
import { ScientificTesting } from "./scientific-testing"
import { CommunicationSystem } from "./communication-system"
import { SpamProtection } from "./spam-protection"
import { ReportingSystem } from "./reporting-system"
import { RevolutionaryUI } from "./revolutionary-ui"
import { useToast } from "@/hooks/use-toast"

interface Test {
  test_id: string
  test_name: string
  status: string
  runtime_status?: string
  config: any
  created_at: string
  started_at?: string
  paused_at?: string
  stopped_at?: string
  current_metrics?: any
}

interface ABCallerPageClientProps {
  initialTests: Test[]
  user: any
}

export function ABCallerPageClient({ initialTests, user }: ABCallerPageClientProps) {
  const [tests, setTests] = useState<Test[]>(initialTests)
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showMetricsDialog, setShowMetricsDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // New state for advanced features
  const [showTemplates, setShowTemplates] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showSampling, setShowSampling] = useState(false)
  const [showGamification, setShowGamification] = useState(false)
  const [showScientific, setShowScientific] = useState(false)
  const [showCommunication, setShowCommunication] = useState(false)
  const [showSpamProtection, setShowSpamProtection] = useState(false)
  const [showReporting, setShowReporting] = useState(false)
  const [showUI, setShowUI] = useState(false)
  
  const { toast } = useToast()

  // Refresh tests periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTests()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/ab-tests')
      const data = await response.json()
      if (data.success) {
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Error fetching tests:', error)
    }
  }

  const createTest = async (config: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()
      if (data.success) {
        setTests(prev => [data.test, ...prev])
        setShowCreateDialog(false)
      } else {
        throw new Error(data.error || 'Failed to create test')
      }
    } catch (error) {
      console.error('Error creating test:', error)
      throw error
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
      assignment: {
        mode: "random_1_to_1",
        block_size: 4
      },
      attempts_policy: {
        max_attempts: 3,
        ring_times_sec: [30, 30, 30],
        min_gap_after_attempts: {
          after_1: 30,
          after_2: 60
        },
        max_attempts_per_hour_per_lead: 2
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
        windowing: {
          horizon: "1h",
          granularity: "10m"
        },
        actions: {
          block: "skip_call",
          slow: "downshift_rate",
          warn: "log_only"
        },
        telemetry_fields: ["reputation_score", "spam_detected_by", "hiya_score"]
      },
      compliance: {
        max_calls_per_cli_per_hour: 30,
        respect_robinson_list: true,
        timezone_aware: true
      }
    }
  }

  const generateSampleMetrics = () => {
    // Generate realistic metrics with some variation
    const baseAnswerRate = 25 + Math.random() * 15 // 25-40%
    const groupAVariation = (Math.random() - 0.5) * 10 // ±5%
    const groupBVariation = (Math.random() - 0.5) * 10 // ±5%
    
    const groupAAnswerRate = Math.max(5, Math.min(50, baseAnswerRate + groupAVariation))
    const groupBAnswerRate = Math.max(5, Math.min(50, baseAnswerRate + groupBVariation))
    
    const totalCalls = 25 + Math.floor(Math.random() * 15) // 25-40 calls
    const groupACalls = Math.floor(totalCalls / 2) + Math.floor(Math.random() * 5)
    const groupBCalls = totalCalls - groupACalls
    
    const groupAAnswered = Math.floor(groupACalls * groupAAnswerRate / 100)
    const groupBAnswered = Math.floor(groupBCalls * groupBAnswerRate / 100)
    
    const winner = groupAAnswerRate > groupBAnswerRate ? 'A' : groupBAnswerRate > groupAAnswerRate ? 'B' : 'tie'
    const answerRateDiff = groupAAnswerRate - groupBAnswerRate
    const statisticalSignificance = Math.abs(answerRateDiff) > 8 && totalCalls > 20

    return {
      test_id: `sample_test_${Date.now()}`,
      test_name: "Sample Test with Realistic Data",
      group_a: {
        total_calls: groupACalls,
        answered_calls: groupAAnswered,
        failed_calls: groupACalls - groupAAnswered,
        busy_calls: Math.floor((groupACalls - groupAAnswered) * 0.3),
        rejected_calls: Math.floor((groupACalls - groupAAnswered) * 0.2),
        voicemail_calls: Math.floor(groupAAnswered * 0.4),
        spam_blocked_calls: Math.floor(groupACalls * 0.05),
        answer_rate: groupAAnswerRate,
        connect_rate: groupAAnswerRate + Math.floor(groupAAnswered * 0.4),
        spam_block_rate: 5 + Math.random() * 3,
        average_duration: 120 + Math.random() * 60,
        total_duration: groupAAnswered * (120 + Math.random() * 60),
        spam_flags: Math.floor(groupACalls * 0.1),
        hangup_rate: 10 + Math.random() * 10,
        leads_contacted: Math.floor(groupACalls * 0.8),
        leads_answered: groupAAnswered,
        callbacks_2h: Math.floor(groupAAnswered * 0.2),
        callbacks_24h: Math.floor(groupAAnswered * 0.1)
      },
      group_b: {
        total_calls: groupBCalls,
        answered_calls: groupBAnswered,
        failed_calls: groupBCalls - groupBAnswered,
        busy_calls: Math.floor((groupBCalls - groupBAnswered) * 0.3),
        rejected_calls: Math.floor((groupBCalls - groupBAnswered) * 0.2),
        voicemail_calls: Math.floor(groupBAnswered * 0.4),
        spam_blocked_calls: Math.floor(groupBCalls * 0.05),
        answer_rate: groupBAnswerRate,
        connect_rate: groupBAnswerRate + Math.floor(groupBAnswered * 0.4),
        spam_block_rate: 5 + Math.random() * 3,
        average_duration: 120 + Math.random() * 60,
        total_duration: groupBAnswered * (120 + Math.random() * 60),
        spam_flags: Math.floor(groupBCalls * 0.1),
        hangup_rate: 10 + Math.random() * 10,
        leads_contacted: Math.floor(groupBCalls * 0.8),
        leads_answered: groupBAnswered,
        callbacks_2h: Math.floor(groupBAnswered * 0.2),
        callbacks_24h: Math.floor(groupBAnswered * 0.1)
      },
      comparison: {
        winner,
        answer_rate_diff: answerRateDiff,
        answer_rate_diff_pct: answerRateDiff,
        connect_rate_diff: (groupAAnswerRate + Math.floor(groupAAnswered * 0.4)) - (groupBAnswerRate + Math.floor(groupBAnswered * 0.4)),
        average_duration_diff: Math.random() * 30 - 15,
        spam_block_rate_diff: Math.random() * 2 - 1,
        statistical_significance: statisticalSignificance,
        confidence_level: statisticalSignificance ? 85 + Math.random() * 10 : 60 + Math.random() * 20
      },
      timestamp: new Date().toISOString()
    }
  }

  const performTestAction = async (testId: string, action: string) => {
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
        setTests(prev => prev.map(test => 
          test.test_id === testId ? { ...test, ...data.test } : test
        ))
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'stopped': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-3 w-3" />
      case 'paused': return <Pause className="h-3 w-3" />
      case 'stopped': return <Square className="h-3 w-3" />
      case 'completed': return <Target className="h-3 w-3" />
      default: return <Settings className="h-3 w-3" />
    }
  }

  const runningTests = tests.filter(test => test.status === 'running')
  const completedTests = tests.filter(test => test.status === 'completed')
  const draftTests = tests.filter(test => test.status === 'draft')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
                onClick={() => setShowCreateDialog(true)}
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTests.length}</div>
              <p className="text-xs text-muted-foreground">
                Finished tests
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

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="sampling">Sampling</TabsTrigger>
            <TabsTrigger value="gamification">Gamification</TabsTrigger>
            <TabsTrigger value="scientific">Scientific</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="spam">Spam Protection</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="ui">UI/UX</TabsTrigger>
          </TabsList>

        {/* Tests Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
            <TabsTrigger value="running">Running ({runningTests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTests.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftTests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {tests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tests yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first A/B test to start optimizing your calling campaigns
                  </p>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Test
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={createSampleTest}
                      disabled={loading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Try Sample Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                  <TestCard
                    key={test.test_id}
                    test={test}
                    onAction={(action) => performTestAction(test.test_id, action)}
                    onViewMetrics={() => {
                      setSelectedTest(test)
                      setShowMetricsDialog(true)
                    }}
                    onViewDetails={() => {
                      setSelectedTest(test)
                      setShowDetailDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="running" className="space-y-4">
            {runningTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No running tests</h3>
                  <p className="text-muted-foreground text-center">
                    Start a test to see it here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {runningTests.map((test) => (
                  <TestCard
                    key={test.test_id}
                    test={test}
                    onAction={(action) => performTestAction(test.test_id, action)}
                    onViewMetrics={() => {
                      setSelectedTest(test)
                      setShowMetricsDialog(true)
                    }}
                    onViewDetails={() => {
                      setSelectedTest(test)
                      setShowDetailDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No completed tests</h3>
                  <p className="text-muted-foreground text-center">
                    Complete a test to see results here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTests.map((test) => (
                  <TestCard
                    key={test.test_id}
                    test={test}
                    onAction={(action) => performTestAction(test.test_id, action)}
                    onViewMetrics={() => {
                      setSelectedTest(test)
                      setShowMetricsDialog(true)
                    }}
                    onViewDetails={() => {
                      setSelectedTest(test)
                      setShowDetailDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            {draftTests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No draft tests</h3>
                  <p className="text-muted-foreground text-center">
                    Create a test to see it here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftTests.map((test) => (
                  <TestCard
                    key={test.test_id}
                    test={test}
                    onAction={(action) => performTestAction(test.test_id, action)}
                    onViewMetrics={() => {
                      setSelectedTest(test)
                      setShowMetricsDialog(true)
                    }}
                    onViewDetails={() => {
                      setSelectedTest(test)
                      setShowDetailDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
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
    </div>
  )
}