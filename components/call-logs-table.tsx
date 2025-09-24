"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Phone } from "lucide-react"

interface Call {
  id: string
  phone_number_id: string
  cadence_id: string
  destination_number: string
  status: string
  duration: number
  cost: number
  call_time: string
  metadata: any
  phone_numbers: {
    number: string
    provider: string
  }
  cadences?: {
    name: string
  }
}

interface CallLogsTableProps {
  calls: Call[]
  onRefresh?: () => void
}

export function CallLogsTable({ calls, onRefresh }: CallLogsTableProps) {
  const [filteredCalls, setFilteredCalls] = useState(calls)
  const [statusFilter, setStatusFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")

  useEffect(() => {
    let filtered = calls

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((call) => call.status === statusFilter)
    }

    // Filter by time
    if (timeFilter !== "all") {
      const now = new Date()
      const cutoffDate = new Date()

      switch (timeFilter) {
        case "today":
          cutoffDate.setHours(0, 0, 0, 0)
          break
        case "week":
          cutoffDate.setDate(now.getDate() - 7)
          break
        case "month":
          cutoffDate.setDate(now.getDate() - 30)
          break
      }

      filtered = filtered.filter((call) => new Date(call.call_time) >= cutoffDate)
    }

    setFilteredCalls(filtered)
  }, [calls, statusFilter, timeFilter])

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      failed: "destructive",
      spam_detected: "destructive",
      busy: "secondary",
      no_answer: "secondary",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "spam_detected":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "busy":
      case "no_answer":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Phone className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatCost = (cost: number) => {
    return cost ? `$${cost.toFixed(2)}` : "$0.00"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Call Logs</CardTitle>
            <CardDescription>
              Recent call activity and results ({filteredCalls.length} of {calls.length} calls)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="spam_detected">SPAM</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Time:</label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Phone className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {calls.length === 0 ? "No calls logged yet" : "No calls match the current filters"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">From</TableHead>
                <TableHead className="text-muted-foreground">To</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
                <TableHead className="text-muted-foreground">Cost</TableHead>
                <TableHead className="text-muted-foreground">Cadence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="text-foreground">{formatTime(call.call_time)}</TableCell>
                  <TableCell className="font-mono text-foreground">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(call.status)}
                      <span>{call.phone_numbers.number}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{call.phone_numbers.provider}</div>
                  </TableCell>
                  <TableCell className="font-mono text-foreground">{call.destination_number}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell className="text-foreground">{formatDuration(call.duration)}</TableCell>
                  <TableCell className="text-foreground">{formatCost(call.cost)}</TableCell>
                  <TableCell className="text-foreground">{call.cadences?.name || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
