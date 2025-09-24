"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MoreHorizontal, Settings, Play, Pause, Trash2, Clock, Phone, TrendingUp, Info, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Cadence {
  id: string
  name: string
  description: string
  phone_numbers: string[]
  rotation_strategy: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PhoneMetrics {
  number: string
  totalCalls: number
  callsPerMinute: number
  lastUsed: string | null
}

interface CadenceStats {
  totalCalls: number
  successfulCalls: number
  lastCallTime: string | null
  lastUsedNumber: string | null
  activeDuration: string
  successRate: number
  phoneMetrics: PhoneMetrics[]
  averageCallsPerMinute: number
  // Additional aggregate metrics
  totalFailed?: number
  totalBusy?: number
  totalNoAnswer?: number
  totalSpamDetected?: number
  averageCallDurationSec?: number
  totalCost?: number
  topNumber?: string | null
}

interface CadencesTableProps {
  cadences: Cadence[]
}

export function CadencesTable({ cadences }: CadencesTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [cadenceStats, setCadenceStats] = useState<Record<string, CadenceStats>>({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadCadenceStats = async () => {
      const stats: Record<string, CadenceStats> = {}

      for (const cadence of cadences) {
        if (cadence.is_active) {
          // Get call stats for this cadence
          const { data: calls } = await supabase
            .from("calls")
            .select("*, phone_numbers(number)")
            .eq("cadence_id", cadence.id)
            .order("call_time", { ascending: false })

          // Get last used phone number
          const { data: lastCall } = await supabase
            .from("calls")
            .select("phone_number_id, phone_numbers(number)")
            .eq("cadence_id", cadence.id)
            .order("call_time", { ascending: false })
            .limit(1)
            .single()

          const totalCalls = calls?.length || 0
          const successfulCalls = calls?.filter((c) => c.status === "success").length || 0
          const lastCallTime = calls?.[0]?.call_time || null
          const activeSince = new Date(cadence.updated_at)
          const now = new Date()
          const diffHours = Math.floor((now.getTime() - activeSince.getTime()) / (1000 * 60 * 60))
          const diffMinutes = Math.floor((now.getTime() - activeSince.getTime()) / (1000 * 60))

          let activeDuration = ""
          if (diffHours < 1) {
            activeDuration = "< 1 hour"
          } else if (diffHours < 24) {
            activeDuration = `${diffHours}h`
          } else {
            const days = Math.floor(diffHours / 24)
            activeDuration = `${days}d ${diffHours % 24}h`
          }

          const phoneMetrics: PhoneMetrics[] = []
          const phoneCallsMap = new Map<string, any[]>()

          // Group calls by phone number
          calls?.forEach((call) => {
            const rel = call.phone_numbers as any
            const phoneNumber = Array.isArray(rel) ? rel[0]?.number : rel?.number
            if (phoneNumber) {
              if (!phoneCallsMap.has(phoneNumber)) {
                phoneCallsMap.set(phoneNumber, [])
              }
              phoneCallsMap.get(phoneNumber)?.push(call)
            }
          })

          // Calculate metrics for each phone number
          phoneCallsMap.forEach((phoneCalls, phoneNumber) => {
            const totalCallsForPhone = phoneCalls.length
            const callsPerMinute = diffMinutes > 0 ? totalCallsForPhone / diffMinutes : 0
            const lastUsed = phoneCalls[0]?.call_time || null

            phoneMetrics.push({
              number: phoneNumber,
              totalCalls: totalCallsForPhone,
              callsPerMinute: Math.round(callsPerMinute * 100) / 100, // Round to 2 decimals
              lastUsed,
            })
          })

          // Sort by total calls descending
          phoneMetrics.sort((a, b) => b.totalCalls - a.totalCalls)

          // Calculate average calls per minute across all phones
          const averageCallsPerMinute =
            phoneMetrics.length > 0
              ? phoneMetrics.reduce((sum, phone) => sum + phone.callsPerMinute, 0) / phoneMetrics.length
              : 0

          const totalFailed = calls?.filter((c) => c.status === "failed").length || 0
          const totalBusy = calls?.filter((c) => c.status === "busy").length || 0
          const totalNoAnswer = calls?.filter((c) => c.status === "no_answer").length || 0
          const totalSpamDetected = calls?.filter((c) => c.status === "spam_detected").length || 0
          const totalDuration = calls?.reduce((sum, c) => sum + (c.duration || 0), 0) || 0
          const averageCallDurationSec = totalCalls > 0 ? Math.round((totalDuration / totalCalls) * 10) / 10 : 0
          const totalCost = calls?.reduce((sum, c) => sum + (Number(c.cost) || 0), 0) || 0
          const topNumber = phoneMetrics[0]?.number || null

          const lastRel = lastCall?.phone_numbers as any
          const lastNumber = Array.isArray(lastRel) ? lastRel[0]?.number : lastRel?.number

          stats[cadence.id] = {
            totalCalls,
            successfulCalls,
            lastCallTime,
            lastUsedNumber: lastNumber || null,
            activeDuration,
            successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
            phoneMetrics,
            averageCallsPerMinute: Math.round(averageCallsPerMinute * 100) / 100,
            totalFailed,
            totalBusy,
            totalNoAnswer,
            totalSpamDetected,
            averageCallDurationSec,
            totalCost: Math.round(totalCost * 1000) / 1000,
            topNumber,
          }
        }
      }

      setCadenceStats(stats)
    }

    if (cadences.length > 0) {
      loadCadenceStats()
    }
  }, [cadences, supabase])

  const getStatusBadge = (isActive: boolean) => {
    return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
  }

  const getStrategyBadge = (strategy: string) => {
    const labels = {
      round_robin: "Round Robin",
      random: "Random",
      reputation_based: "Reputation Based",
    }

    return <Badge variant="outline">{labels[strategy as keyof typeof labels] || strategy}</Badge>
  }

  const formatLastCall = (lastCallTime: string | null) => {
    if (!lastCallTime) return "No calls"

    const diff = Date.now() - new Date(lastCallTime).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(id)
    try {
      const { error } = await supabase
        .from("cadences")
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating cadence:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cadence?")) return

    setLoading(id)
    try {
      const { error } = await supabase.from("cadences").delete().eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting cadence:", error)
    } finally {
      setLoading(null)
    }
  }

  const formatPhoneMetrics = (phoneMetrics: PhoneMetrics[], overallAvgCpm?: number) => {
    if (phoneMetrics.length === 0) return "No data"

    const topPhone = phoneMetrics[0]
    const totalPhones = phoneMetrics.length

    return (
      <div className="space-y-1">
        <div className="text-xs font-medium">
          Most used: •••{topPhone.number.slice(-4)} ({topPhone.totalCalls} calls)
        </div>
        <div className="text-xs text-muted-foreground">
          {topPhone.callsPerMinute}/min • {totalPhones} active numbers
        </div>
        {typeof overallAvgCpm === "number" && (
          <div className="text-[10px] text-muted-foreground">Overall avg: {overallAvgCpm}/min</div>
        )}
      </div>
    )
  }

  if (cadences.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay cadencias</h3>
          <p className="text-muted-foreground text-center mb-4">
            Crea tu primera cadencia para comenzar las pruebas A/B con rotación de números
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Cadence Status:</strong> Active cadences automatically rotate assigned numbers according to the selected
          strategy. Active time counts from the last activation. Metrics include calls per minute per number, total calls
          distribution, most used number, and overall averages.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Cadences ({cadences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Description</TableHead>
                <TableHead className="text-muted-foreground">Numbers</TableHead>
                <TableHead className="text-muted-foreground">Strategy</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Active Time</TableHead>
                <TableHead className="text-muted-foreground">Calls</TableHead>
                <TableHead className="text-muted-foreground">Last Number</TableHead>
                <TableHead className="text-muted-foreground">Last Call</TableHead>
                <TableHead className="text-muted-foreground">Per-Number Metrics</TableHead>
                <TableHead className="text-muted-foreground">Detailed Metrics</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cadences.map((cadence) => {
                const stats = cadenceStats[cadence.id]
                return (
                  <TableRow key={cadence.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{cadence.name}</div>
                        <div className="text-sm text-muted-foreground">{cadence.description || "No description"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground max-w-xs truncate">
                      {cadence.description || "No description"}
                    </TableCell>
                    <TableCell className="text-foreground">{cadence.phone_numbers.length} numbers</TableCell>
                    <TableCell>{getStrategyBadge(cadence.rotation_strategy)}</TableCell>
                    <TableCell>{getStatusBadge(cadence.is_active)}</TableCell>
                    <TableCell className="text-foreground">
                      {cadence.is_active ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-green-500" />
                          <span className="text-sm">{stats?.activeDuration || "Calculating..."}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Stopped</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {cadence.is_active && stats ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">
                              {stats.totalCalls} ({stats.successfulCalls} successful)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-muted-foreground">
                              {stats.averageCallsPerMinute}/min average
                            </span>
                          </div>
                          {stats.totalCalls > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {stats.successRate.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {cadence.is_active && stats?.lastUsedNumber ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-orange-500" />
                          <span className="text-sm font-mono">{stats.lastUsedNumber.slice(-4)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span className="text-sm">
                        {cadence.is_active && stats ? formatLastCall(stats.lastCallTime) : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {cadence.is_active && stats?.phoneMetrics ? (
                        formatPhoneMetrics(stats.phoneMetrics, stats.averageCallsPerMinute)
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {cadence.is_active && stats ? (
                        <div className="space-y-1 text-xs">
                          <div>Top number: •••{stats.topNumber?.slice(-4) || "-"}</div>
                          <div>Calls/min (overall): {stats.averageCallsPerMinute}</div>
                          <div>Success rate: {stats.successRate.toFixed(0)}%</div>
                          <div>Avg. call duration: {stats.averageCallDurationSec}s</div>
                          <div>Total cost: ${stats.totalCost}</div>
                          <div className="text-muted-foreground">
                            Failed: {stats.totalFailed} • Busy: {stats.totalBusy} • No answer: {stats.totalNoAnswer} • Spam: {stats.totalSpamDetected}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading === cadence.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(cadence.id, cadence.is_active)}>
                            {cadence.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(cadence.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
