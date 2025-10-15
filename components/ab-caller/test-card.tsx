"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, Pause, Square, BarChart3, Settings, Trash2, Eye, Target, TrendingUp, Users, Phone, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

interface TestCardProps {
  test: Test
  onAction: (action: string) => void
  onViewMetrics: () => void
  onViewDetails: () => void
}

export function TestCard({ test, onAction, onViewMetrics, onViewDetails }: TestCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200'
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'stopped': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Running'
      case 'paused': return 'Paused'
      case 'stopped': return 'Stopped'
      case 'completed': return 'Completed'
      case 'draft': return 'Draft'
      default: return 'Unknown'
    }
  }

  const getAvailableActions = (status: string) => {
    switch (status) {
      case 'draft': return ['start']
      case 'running': return ['pause', 'stop']
      case 'paused': return ['resume', 'stop']
      case 'stopped': return []
      case 'completed': return []
      default: return []
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'start': return <Play className="h-4 w-4" />
      case 'pause': return <Pause className="h-4 w-4" />
      case 'resume': return <Play className="h-4 w-4" />
      case 'stop': return <Square className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'start': return 'Start'
      case 'pause': return 'Pause'
      case 'resume': return 'Resume'
      case 'stop': return 'Stop'
      default: return action
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const getTestDuration = () => {
    if (test.started_at) {
      return formatDuration(test.started_at, test.stopped_at)
    }
    return null
  }

  const getTestStats = () => {
    if (!test.current_metrics) return null
    
    const { group_a, group_b } = test.current_metrics
    
    // Handle undefined or null values with safe defaults
    const groupATotalCalls = group_a?.total_calls || 0
    const groupBTotalCalls = group_b?.total_calls || 0
    const groupAAnsweredCalls = group_a?.answered_calls || 0
    const groupBAnsweredCalls = group_b?.answered_calls || 0
    
    const totalCalls = groupATotalCalls + groupBTotalCalls
    const totalAnswered = groupAAnsweredCalls + groupBAnsweredCalls
    const overallAnswerRate = totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0
    
    return {
      totalCalls,
      totalAnswered,
      overallAnswerRate,
      winner: test.current_metrics.comparison?.winner || 'tie'
    }
  }

  const stats = getTestStats()
  const availableActions = getAvailableActions(test.status)
  const duration = getTestDuration()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {test.test_name}
            </CardTitle>
            <CardDescription className="text-sm">
              {test.config?.groups?.A?.label} vs {test.config?.groups?.B?.label}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(test.status)} flex items-center space-x-1`}>
              {getStatusIcon(test.status)}
              <span>{getStatusText(test.status)}</span>
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {stats && (
                  <DropdownMenuItem onClick={onViewMetrics}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Metrics
                  </DropdownMenuItem>
                )}
                {availableActions.map((action) => (
                  <DropdownMenuItem
                    key={action}
                    onClick={() => onAction(action)}
                    className={action === 'stop' ? 'text-red-600' : ''}
                  >
                    {getActionIcon(action)}
                    <span className="ml-2">{getActionText(action)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Test Configuration Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Leads</span>
            </div>
            <div className="font-medium">
              {test.config?.leads?.length || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>Max Attempts</span>
            </div>
            <div className="font-medium">
              {test.config?.attempts_policy?.max_attempts || 3}
            </div>
          </div>
        </div>

        {/* Test Stats (if available) */}
        {stats && (
          <div className="space-y-3">
            <div className="border-t pt-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>Total Calls</span>
                  </div>
                  <div className="font-medium text-lg">
                    {stats.totalCalls}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Answer Rate</span>
                  </div>
                  <div className="font-medium text-lg">
                    {stats.overallAnswerRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Badge */}
            {test.status === 'completed' && stats.winner !== 'tie' && (
              <div className="flex items-center justify-center">
                <Badge 
                  variant="default" 
                  className={`${
                    stats.winner === 'A' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Target className="h-3 w-3 mr-1" />
                  Group {stats.winner} Wins!
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Test Duration */}
        {duration && (
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Duration: {duration}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <span>Created {formatDistanceToNow(new Date(test.created_at))} ago</span>
        </div>

        {/* Action Buttons */}
        {availableActions.length > 0 && (
          <div className="flex space-x-2 pt-2 border-t">
            {availableActions.map((action) => (
              <Button
                key={action}
                variant={action === 'stop' ? 'destructive' : 'default'}
                size="sm"
                onClick={() => onAction(action)}
                className="flex-1"
              >
                {getActionIcon(action)}
                <span className="ml-1">{getActionText(action)}</span>
              </Button>
            ))}
          </div>
        )}

        {/* View Metrics Button for Completed Tests */}
        {test.status === 'completed' && stats && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewMetrics}
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Results
          </Button>
        )}
      </CardContent>
    </Card>
  )
}