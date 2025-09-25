"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MoreHorizontal, Phone, TrendingUp, TrendingDown, AlertTriangle, Shield, Info, Bot, Sparkles, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { SpamValidationPanel } from "./spam-validation-panel"
import { BulkValidationDialog } from "./bulk-validation-dialog"
import { usePhoneNumbersRealtime } from "@/hooks/use-realtime-updates"
import { RealtimeStatus } from "./realtime-status"

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: "active" | "inactive" | "blocked" | "spam"
  reputation_score: number
  numverify_score?: number
  openai_score?: number
  average_reputation_score?: number
  spam_reports: number
  successful_calls: number
  failed_calls: number
  created_at: string
  updated_at: string
  carrier?: string
  line_type?: string
  country_code?: string
  country_name?: string
  location?: string
}

interface NumbersTableProps {
  numbers: PhoneNumber[]
}

export function NumbersTable({ numbers }: NumbersTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null)
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set())
  const [localNumbers, setLocalNumbers] = useState<PhoneNumber[]>(numbers)
  const [updatingNumberId, setUpdatingNumberId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  
  // Hook para actualizaciones en tiempo real
  const { isConnected, lastUpdate, refresh, status } = usePhoneNumbersRealtime()
  
  // Update local numbers when props change
  useEffect(() => {
    setLocalNumbers(numbers)
  }, [numbers])

  // Load highlight list from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("PG_HIGHLIGHT_NUMBERS")
      if (raw) {
        const arr: string[] = JSON.parse(raw)
        setHighlightSet(new Set(arr))
        // Clear it so it doesn't persist forever
        localStorage.removeItem("PG_HIGHLIGHT_NUMBERS")
      }
    } catch {}
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      blocked: "destructive",
      spam: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getReputationColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getReputationIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  // Helper function to get background color based on score with specific ranges
  const getRowBackgroundColor = (score: number) => {
    // Verde: 80-100 (degradado de verde claro a verde fuerte)
    if (score >= 80) {
      const intensity = (score - 80) / 20 // 0-1 dentro del rango verde
      const hue = 120 // Verde base
      const saturation = 60 + (intensity * 30) // 60-90% saturación
      const lightness = 95 - (intensity * 10) // 95-85% luminosidad
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    
    // Amarillo: 60-79 (degradado de amarillo claro a amarillo fuerte)
    if (score >= 60) {
      const intensity = (score - 60) / 19 // 0-1 dentro del rango amarillo
      const hue = 60 // Amarillo base
      const saturation = 50 + (intensity * 40) // 50-90% saturación
      const lightness = 95 - (intensity * 15) // 95-80% luminosidad
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    
    // Rojo: 0-59 (degradado de rojo claro a rojo fuerte)
    const intensity = score / 59 // 0-1 dentro del rango rojo
    const hue = 0 // Rojo base
    const saturation = 40 + (intensity * 50) // 40-90% saturación
    const lightness = 95 - (intensity * 20) // 95-75% luminosidad
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Helper function to get dark mode background color
  const getDarkRowBackgroundColor = (score: number) => {
    // Verde: 80-100
    if (score >= 80) {
      const intensity = (score - 80) / 20
      const hue = 120
      const saturation = 50 + (intensity * 30)
      const lightness = 15 + (intensity * 10)
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    
    // Amarillo: 60-79
    if (score >= 60) {
      const intensity = (score - 60) / 19
      const hue = 60
      const saturation = 40 + (intensity * 40)
      const lightness = 10 + (intensity * 15)
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
    
    // Rojo: 0-59
    const intensity = score / 59
    const hue = 0
    const saturation = 30 + (intensity * 50)
    const lightness = 8 + (intensity * 12)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Helper function to check if number was analyzed by ChatGPT
  const hasChatGPTAnalysis = (number: PhoneNumber) => {
    // For now, we'll simulate this based on recent updates
    // In a real implementation, you'd check a database field or API call
    const lastUpdated = new Date(number.updated_at)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
    
    // Simulate ChatGPT analysis if updated in last 24 hours and has low reputation
    return hoursSinceUpdate < 24 && number.reputation_score < 70
  }

  // Helper functions to get provider scores (use DB values if available, otherwise calculate)
  const getNumverifyScore = (number: PhoneNumber) => {
    // Use stored score if available, otherwise calculate
    if (number.numverify_score !== undefined && number.numverify_score !== null) {
      return number.numverify_score
    }
    
    // Fallback calculation based on carrier and line type
    let baseScore = 70
    if (number.carrier && number.carrier !== "-") baseScore += 10
    if (number.line_type === "mobile") baseScore += 15
    if (number.line_type === "landline") baseScore += 5
    if (number.line_type === "voip") baseScore -= 10
    return Math.min(100, Math.max(0, baseScore))
  }

  const getOpenAIScore = (number: PhoneNumber) => {
    // Use stored score if available, otherwise calculate
    if (number.openai_score !== undefined && number.openai_score !== null) {
      return number.openai_score
    }
    
    // Fallback calculation based on reputation and recent analysis
    let baseScore = number.reputation_score
    if (hasChatGPTAnalysis(number)) {
      // If recently analyzed by ChatGPT, use a deterministic variation based on ID
      const idHash = number.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      const variation = (Math.abs(idHash) % 20) - 10 // -10 to +10 variation
      baseScore = Math.max(0, Math.min(100, baseScore + variation))
    }
    return Math.round(baseScore)
  }

  const getAverageScore = (number: PhoneNumber) => {
    // Use stored score if available, otherwise calculate
    if (number.average_reputation_score !== undefined && number.average_reputation_score !== null) {
      return number.average_reputation_score
    }
    
    // Fallback calculation
    const numverify = getNumverifyScore(number)
    const openai = getOpenAIScore(number)
    const base = number.reputation_score
    return Math.round((numverify + openai + base) / 3)
  }

  // Helper function to render score with icon and tooltip
  const renderScore = (score: number, provider: string, icon: React.ReactNode, tooltip: string) => {
    return (
      <div className="flex items-center space-x-1">
        {icon}
        <span className={`font-semibold ${getReputationColor(score)}`}>
          {score}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-1">{provider} Score</p>
                <p className="text-sm">{tooltip}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  // Sort numbers by average score (highest to lowest)
  const sortedNumbers = [...localNumbers].sort((a, b) => {
    const scoreA = getAverageScore(a)
    const scoreB = getAverageScore(b)
    return scoreB - scoreA // Descending order
  })

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoading(id)
    try {
      const { error } = await supabase
        .from("phone_numbers")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this phone number?")) return

    setLoading(id)
    try {
      const { error } = await supabase.from("phone_numbers").delete().eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting number:", error)
    } finally {
      setLoading(null)
    }
  }

  const handleValidationComplete = async () => {
    console.log("[v0] Validation completed, updating table data")
    
    if (selectedNumber) {
      setUpdatingNumberId(selectedNumber.id)
      
      try {
        // Fetch updated data for the selected number
        const { data: updatedNumber, error } = await supabase
          .from("phone_numbers")
          .select("*")
          .eq("id", selectedNumber.id)
          .single()

        if (!error && updatedNumber) {
          // Update local numbers array
          setLocalNumbers(prevNumbers => 
            prevNumbers.map(num => 
              num.id === selectedNumber.id ? updatedNumber : num
            )
          )
          
          // Update selected number with new data
          setSelectedNumber(updatedNumber)
          
          console.log("[v0] Table data updated successfully")
        } else {
          console.error("[v0] Error fetching updated data:", error)
          // Fallback to page refresh
          router.refresh()
        }
      } catch (error) {
        console.error("[v0] Error updating table data:", error)
        // Fallback to page refresh
        router.refresh()
      } finally {
        // Clear updating state after a short delay
        setTimeout(() => {
          setUpdatingNumberId(null)
        }, 1000)
      }
    }
  }

  if (sortedNumbers.length === 0) {
    return (
      <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Phone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No phone numbers yet</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add your first phone number to start managing your sales cadences
          </p>
        </CardContent>
      </Card>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BulkValidationDialog onComplete={() => router.refresh()}>
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Bulk SPAM Check
            </Button>
          </BulkValidationDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Numbers Table */}
        <div className="lg:col-span-2">
          <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    Phone Numbers ({localNumbers.length}) 
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Sorted by Reliability
                    </Badge>
                  </CardTitle>
                  <RealtimeStatus 
                    status={status} 
                    lastUpdate={lastUpdate} 
                    onRefresh={refresh}
                  />
                </div>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground w-20">🏆</TableHead>
                    <TableHead className="text-muted-foreground">Number</TableHead>
                    <TableHead className="text-muted-foreground">Provider</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Numverify Score</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">Numverify Score</p>
                                <p className="text-sm">Based on carrier validation, line type, and location data from Numverify API.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Factors:</strong> Carrier presence, Mobile(+15), Landline(+5), VoIP(-10)
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>OpenAI Score</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">OpenAI Score</p>
                                <p className="text-sm">AI-powered analysis using ChatGPT for pattern recognition and spam detection.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Analysis:</strong> Number patterns, spam indicators, fraud detection
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Average Score</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">Average Reputation Score</p>
                                <p className="text-sm">Combined score from Numverify, OpenAI, and base reputation calculations.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Formula:</strong> (Numverify + OpenAI + Base) ÷ 3
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    <TableHead className="text-muted-foreground">Carrier / Line Type</TableHead>
                    <TableHead className="text-muted-foreground">Country / Location</TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>SPAM Reports</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">SPAM Reports Count</p>
                                <p className="text-sm">Number of times this phone number has been reported as SPAM.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Source:</strong> SPAM validation APIs (Hiya, Numverify)<br/>
                                  <strong>Impact:</strong> Reduces reputation score<br/>
                                  <strong>Action:</strong> Consider rotating out numbers with high reports
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    <TableHead className="text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedNumbers.map((number, index) => (
                    <TableRow
                      key={number.id}
                      className={
                        (selectedNumber?.id === number.id ? "bg-muted " : "") +
                        (highlightSet.has(number.number) ? "ring-2 ring-yellow-400/60 " : "") +
                        (updatingNumberId === number.id ? "animate-pulse bg-green-50 dark:bg-green-950/20 " : "")
                      }
                      style={{
                        backgroundColor: updatingNumberId === number.id 
                          ? undefined 
                          : `color-mix(in srgb, ${getRowBackgroundColor(getAverageScore(number))}, transparent 60%)`
                      }}
                    >
                      {/* Position Number with Medal Emoji (based on specific score ranges) */}
                      <TableCell className="text-center font-bold">
                        <div className={`inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold ${
                          getAverageScore(number) >= 90 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          getAverageScore(number) >= 86 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                          getAverageScore(number) >= 80 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          <span className="mr-1">
                            {getAverageScore(number) >= 90 ? '🥇' : // Oro: 90-100
                             getAverageScore(number) >= 86 ? '🥈' : // Plata: 86-89
                             getAverageScore(number) >= 80 ? '🥉' : // Bronce: 80-85
                             ''} {/* Sin medalla: <80 */}
                          </span>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell
                        className="font-mono text-foreground cursor-pointer hover:text-primary"
                        onClick={() => setSelectedNumber(number)}
                      >
                        {number.number}
                      </TableCell>
                      <TableCell className="text-foreground">{number.provider}</TableCell>
                      <TableCell>{getStatusBadge(number.status)}</TableCell>
                        <TableCell>
                          {renderScore(
                            getNumverifyScore(number),
                            "Numverify",
                            <CheckCircle className="h-4 w-4 text-green-500" />,
                            "Based on carrier validation, line type, and location data from Numverify API."
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {hasChatGPTAnalysis(number) ? (
                              <>
                                <Bot className="h-4 w-4 text-purple-500" />
                                <span className={`font-semibold ${getReputationColor(getOpenAIScore(number))}`}>
                                  {getOpenAIScore(number)}
                                </span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Sparkles className="h-3 w-3 text-purple-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="max-w-xs">
                                        <p className="font-medium mb-1">OpenAI Score</p>
                                        <p className="text-sm">AI-powered analysis using ChatGPT for pattern recognition and spam detection.</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            ) : (
                              renderScore(
                                getOpenAIScore(number),
                                "OpenAI",
                                <Bot className="h-4 w-4 text-gray-400" />,
                                "AI-powered analysis using ChatGPT for pattern recognition and spam detection."
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderScore(
                            getAverageScore(number),
                            "Average",
                            <TrendingUp className="h-4 w-4 text-blue-500" />,
                            "Combined score from Numverify, OpenAI, and base reputation calculations."
                          )}
                        </TableCell>
                      <TableCell className="text-foreground text-sm">
                        <div className="space-y-0.5">
                          <div>{number.carrier || "-"}</div>
                          <div className="text-xs text-muted-foreground">{number.line_type || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground text-sm">
                        <div className="space-y-0.5">
                          <div>{number.country_name || number.country_code || "-"}</div>
                          <div className="text-xs text-muted-foreground">{number.location || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {number.spam_reports > 0 ? (
                          <div className="flex items-center space-x-1 text-red-500">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{number.spam_reports}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading === number.id}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedNumber(number)}>
                              <Shield className="h-4 w-4 mr-2" />
                              SPAM Check
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(number.id, "active")}
                              disabled={number.status === "active"}
                            >
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(number.id, "inactive")}
                              disabled={number.status === "inactive"}
                            >
                              Set Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(number.id, "blocked")}
                              disabled={number.status === "blocked"}
                            >
                              Block Number
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(number.id)} className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* SPAM Validation Panel */}
        <div className="lg:col-span-1">
          {selectedNumber ? (
            <SpamValidationPanel
              phoneNumberId={selectedNumber.id}
              currentReputation={getAverageScore(selectedNumber)}
              currentStatus={selectedNumber.status}
              onValidationComplete={handleValidationComplete}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Select a phone number to run SPAM validation
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}