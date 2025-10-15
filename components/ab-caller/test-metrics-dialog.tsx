"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download, BarChart3, TrendingUp, Users, Phone } from "lucide-react"

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

interface TestMetricsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  test: Test
}

interface MetricsData {
  test_id: string
  test_name: string
  group_a: any
  group_b: any
  comparison: any
  timestamp: string
}

export function TestMetricsDialog({ open, onOpenChange, test }: TestMetricsDialogProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && test) {
      fetchMetrics()
    }
  }, [open, test])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      // If test already has metrics (sample data), use them
      if (test.current_metrics) {
        setMetrics(test.current_metrics)
        setLoading(false)
        return
      }

      const response = await fetch(`/api/ab-tests/${test.test_id}/metrics`)
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data)
      }
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportMetrics = async () => {
    try {
      const response = await fetch(`/api/ab-tests/${test.test_id}/metrics/export`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${test.test_name}_metrics.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting metrics:', error)
    }
  }

  const getWinnerBadge = (winner: string) => {
    if (winner === 'A') {
      return <Badge variant="default" className="bg-green-600">Group A Wins</Badge>
    } else if (winner === 'B') {
      return <Badge variant="default" className="bg-blue-600">Group B Wins</Badge>
    } else {
      return <Badge variant="secondary">Tie</Badge>
    }
  }

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%'
    }
    return `${value.toFixed(1)}%`
  }

  const formatDuration = (seconds: number | undefined | null) => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return '0:00'
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Test Metrics - {test.test_name}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed metrics and comparison for your A/B test
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportMetrics}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          {metrics?.comparison && (
            <div className="flex items-center space-x-2">
              {getWinnerBadge(metrics.comparison.winner)}
              {metrics.comparison.statistical_significance && (
                <Badge variant="outline">Statistically Significant</Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading metrics...</span>
          </div>
        ) : metrics ? (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="groups">Group Comparison</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.group_a.total_calls || 0) + (metrics.group_b.total_calls || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A: {metrics.group_a.total_calls || 0} | B: {metrics.group_b.total_calls || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Answer Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPercentage((metrics.group_a?.answer_rate || 0 + metrics.group_b?.answer_rate || 0) / 2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      A: {formatPercentage(metrics.group_a?.answer_rate)} | B: {formatPercentage(metrics.group_b?.answer_rate)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Winner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.comparison.winner === 'A' ? 'Group A' : 
                       metrics.comparison.winner === 'B' ? 'Group B' : 'Tie'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.abs(metrics.comparison.answer_rate_diff_pct).toFixed(1)}% difference
                    </p>
                  </CardContent>
                </Card>
              </div>

              {metrics.comparison.statistical_significance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistical Significance</CardTitle>
                    <CardDescription>
                      This test has reached statistical significance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Confidence Level:</span>
                        <span className="font-medium">{metrics.comparison.confidence_level}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Answer Rate Difference:</span>
                        <span className="font-medium">{formatPercentage(Math.abs(metrics.comparison?.answer_rate_diff_pct || 0))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Group A - {test.config.groups.A.label}</CardTitle>
                    <CardDescription>CLI: {test.config.groups.A.cli}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{metrics.group_a?.total_calls || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Calls</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.group_a?.answered_calls || 0}</div>
                        <div className="text-sm text-muted-foreground">Answered</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatPercentage(metrics.group_a?.answer_rate)}</div>
                        <div className="text-sm text-muted-foreground">Answer Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(metrics.group_a?.average_duration)}</div>
                        <div className="text-sm text-muted-foreground">Avg Duration</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Group B - {test.config.groups.B.label}</CardTitle>
                    <CardDescription>CLI: {test.config.groups.B.cli}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">{metrics.group_b?.total_calls || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Calls</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{metrics.group_b?.answered_calls || 0}</div>
                        <div className="text-sm text-muted-foreground">Answered</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{(metrics.group_b?.answer_rate || 0).toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Answer Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(metrics.group_b?.average_duration)}</div>
                        <div className="text-sm text-muted-foreground">Avg Duration</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Answer Rate</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Group A:</span>
                            <span>{formatPercentage(metrics.group_a?.answer_rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Group B:</span>
                            <span>{formatPercentage(metrics.group_b?.answer_rate)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Difference:</span>
                            <span className={metrics.comparison.answer_rate_diff > 0 ? 'text-green-600' : 'text-red-600'}>
                              {metrics.comparison?.answer_rate_diff > 0 ? '+' : ''}{formatPercentage(metrics.comparison?.answer_rate_diff)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Connect Rate</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Group A:</span>
                            <span>{formatPercentage(metrics.group_a?.connect_rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Group B:</span>
                            <span>{formatPercentage(metrics.group_b?.connect_rate)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Difference:</span>
                            <span className={metrics.comparison.connect_rate_diff > 0 ? 'text-green-600' : 'text-red-600'}>
                              {metrics.comparison?.connect_rate_diff > 0 ? '+' : ''}{formatPercentage(metrics.comparison?.connect_rate_diff)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Average Duration</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Group A:</span>
                            <span>{formatDuration(metrics.group_a?.average_duration)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Group B:</span>
                            <span>{formatDuration(metrics.group_b?.average_duration)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Difference:</span>
                            <span className={metrics.comparison.average_duration_diff > 0 ? 'text-green-600' : 'text-red-600'}>
                              {metrics.comparison?.average_duration_diff > 0 ? '+' : ''}{formatDuration(Math.abs(metrics.comparison?.average_duration_diff || 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Spam Block Rate</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Group A:</span>
                            <span>{formatPercentage(metrics.group_a?.spam_block_rate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Group B:</span>
                            <span>{formatPercentage(metrics.group_b?.spam_block_rate)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Difference:</span>
                            <span className={metrics.comparison.spam_block_rate_diff > 0 ? 'text-red-600' : 'text-green-600'}>
                              {metrics.comparison?.spam_block_rate_diff > 0 ? '+' : ''}{formatPercentage(metrics.comparison?.spam_block_rate_diff)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No metrics available</h3>
            <p className="text-muted-foreground">
              Metrics will appear once the test starts running
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}