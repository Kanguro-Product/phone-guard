"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Play, FileText, RotateCcw, XCircle, CheckCircle, AlertTriangle } from "lucide-react"
import { format, formatDistanceToNow, differenceInMilliseconds } from "date-fns"
import { ReportMetricsDialog } from "./report-metrics-dialog"
import { TestDetailDialog } from "./test-detail-dialog"
import { useToast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"

interface Test {
  id: string
  test_key: string
  code: string
  full_id: string
  name: string
  alternative_name?: string
  hypothesis: string
  objective: string
  design: string
  variants: any[]
  sample_per_variant: any
  duration_hours: number
  status: 'Pending' | 'Running' | 'ToReport' | 'Finished' | 'Canceled'
  created_at: string
  started_at?: string
  ended_at?: string
  owner_user_id: string
  parent_test_key?: string
  iteration_index: number
  success_criteria: string
  independent_variable: string
  dependent_variables: any[]
  planned_start_date?: string
  channels: any[]
  operational_notes?: string
  phone_numbers_used: any[]
}

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: string
}

interface TestCardProps {
  test: Test
  onUpdate: () => void
  phoneNumbers: PhoneNumber[]
}

export function TestCard({ test, onUpdate, phoneNumbers }: TestCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Calculate time remaining for running tests
  useEffect(() => {
    if (test.status === 'Running' && test.started_at) {
      const interval = setInterval(() => {
        const startTime = new Date(test.started_at!)
        const endTime = new Date(startTime.getTime() + test.duration_hours * 60 * 60 * 1000)
        const now = new Date()
        
        const remaining = differenceInMilliseconds(endTime, now)
        
        if (remaining <= 0) {
          setTimeRemaining('00:00:00')
          setProgress(100)
          // Auto-transition to ToReport
          handleAutoTransition()
          clearInterval(interval)
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
          
          setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
          
          const totalDuration = test.duration_hours * 60 * 60 * 1000
          const elapsed = totalDuration - remaining
          setProgress(Math.min((elapsed / totalDuration) * 100, 100))
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [test.status, test.started_at, test.duration_hours])

  // Handle auto-transition to ToReport
  const handleAutoTransition = async () => {
    try {
      await fetch(`/api/callops/tests/${test.full_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ToReport',
          ended_at: new Date().toISOString()
        })
      })
      onUpdate()
    } catch (error) {
      console.error('Error auto-transitioning test:', error)
    }
  }

  // Handle start test
  const handleStart = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/callops/tests/${test.full_id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast({
        title: "✅ Test Started",
        description: "The execution is now active. Data collection is locked until completion."
      })

      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start test',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle cancel test
  const handleCancel = async () => {
    if (!cancelReason || cancelReason.length < 10) {
      toast({
        title: "Error",
        description: "Cancellation reason must be at least 10 characters",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/callops/tests/${test.full_id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast({
        title: "Test Canceled",
        description: "The test has been canceled"
      })

      setCancelReason('')
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to cancel test',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Get status badge
  const getStatusBadge = () => {
    const styles = {
      Pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending' },
      Running: { icon: Play, color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Running' },
      ToReport: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'To Report' },
      Finished: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300', label: 'Finished' },
      Canceled: { icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Canceled' }
    }

    const config = styles[test.status]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{test.alternative_name || test.name}</CardTitle>
            <CardDescription className="font-mono text-xs">{test.full_id}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">{test.code}</Badge>
          {test.iteration_index > 0 && (
            <Badge variant="outline">Iteration {test.iteration_index}</Badge>
          )}
          {test.variants.map((v: any) => (
            <Badge key={v.id} variant="outline">{v.id}: {v.label}</Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hypothesis */}
        <div>
          <div className="text-sm font-medium mb-1">Hypothesis</div>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {test.hypothesis}
          </div>
        </div>

        {/* Running Timer */}
        {test.status === 'Running' && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900">Time Remaining</div>
              <div className="text-2xl font-mono font-bold text-blue-900">
                {timeRemaining}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-blue-700">
              Started {test.started_at && formatDistanceToNow(new Date(test.started_at), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Pending Info */}
        {test.status === 'Pending' && (
          <div className="space-y-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm font-medium text-yellow-900">Ready to Start</div>
            <div className="text-xs text-yellow-700">
              Duration: {test.duration_hours} hours | {test.variants.length} variants
            </div>
          </div>
        )}

        {/* ToReport Info */}
        {test.status === 'ToReport' && (
          <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm font-medium text-orange-900">Ready to Report</div>
            <div className="text-xs text-orange-700">
              Completed {test.ended_at && formatDistanceToNow(new Date(test.ended_at), { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Finished Info */}
        {test.status === 'Finished' && (
          <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-900">Completed</div>
            <div className="text-xs text-green-700">
              Finished {test.ended_at && format(new Date(test.ended_at), 'PPp')}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div>Created {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}</div>
          {test.channels.length > 0 && (
            <div>Channels: {test.channels.join(', ')}</div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {/* Pending Actions */}
        {test.status === 'Pending' && (
          <>
            <Button onClick={handleStart} disabled={loading} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Test
            </Button>
            <TestDetailDialog test={test} open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </Button>
            </TestDetailDialog>
          </>
        )}

        {/* Running Actions */}
        {test.status === 'Running' && (
          <>
            <TestDetailDialog test={test} open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
              <Button variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </TestDetailDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Test Execution?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop the test execution. Please provide a reason for cancellation.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  placeholder="Reason for cancellation (minimum 10 characters)..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Running</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel} disabled={loading || cancelReason.length < 10}>
                    Cancel Test
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* ToReport Actions */}
        {test.status === 'ToReport' && (
          <>
            <ReportMetricsDialog 
              test={test} 
              open={reportDialogOpen} 
              onOpenChange={setReportDialogOpen}
              onReported={onUpdate}
            >
              <Button className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Report Metrics
              </Button>
            </ReportMetricsDialog>
            <TestDetailDialog test={test} open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
              <Button variant="outline">
                Details
              </Button>
            </TestDetailDialog>
          </>
        )}

        {/* Finished Actions */}
        {test.status === 'Finished' && (
          <>
            <TestDetailDialog test={test} open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
              <Button variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </TestDetailDialog>
            <Button>
              <RotateCcw className="h-4 w-4 mr-2" />
              Iterate Test
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
