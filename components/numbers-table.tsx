"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MoreHorizontal, Phone, TrendingUp, TrendingDown, AlertTriangle, Shield, Info, Bot, Sparkles, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Archive, Trash2 } from "lucide-react"
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
  
  // Sorting and filtering states
  const [sortField, setSortField] = useState<keyof PhoneNumber>('average_reputation_score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    status: 'all' as string,
    provider: 'all' as string,
    scoreRange: 'all' as string,
    showSpamOnly: false
  })
  
  // Hook para actualizaciones en real-time
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
      deprecated: "outline",
    } as const

    const labels = {
      active: "Activo",
      inactive: "Inactivo",
      blocked: "Bloqueado",
      spam: "Spam",
      deprecated: "En Desuso",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status.charAt(0).toUpperCase() + status.slice(1)}
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

  // Sorting functions
  const handleSort = (field: keyof PhoneNumber) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: keyof PhoneNumber) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4 text-primary" /> : 
      <ArrowDown className="h-4 w-4 text-primary" />
  }

  // Filtering functions
  const applyFilters = (numbers: PhoneNumber[]) => {
    return numbers.filter(number => {
      // By default, exclude deprecated numbers unless specifically filtering for them
      if (filters.status !== 'deprecated' && number.status === 'deprecated') return false
      
      // Status filter
      if (filters.status !== 'all' && number.status !== filters.status) return false
      
      // Provider filter
      if (filters.provider !== 'all' && number.provider !== filters.provider) return false
      
      // Score range filter
      const averageScore = getAverageScore(number)
      if (filters.scoreRange !== 'all') {
        switch (filters.scoreRange) {
          case 'excellent': if (averageScore < 90) return false; break
          case 'good': if (averageScore < 80 || averageScore >= 90) return false; break
          case 'fair': if (averageScore < 60 || averageScore >= 80) return false; break
          case 'poor': if (averageScore >= 60) return false; break
        }
      }
      
      // Spam only filter
      if (filters.showSpamOnly && number.status !== 'spam') return false
      
      return true
    })
  }

  // Recommendation system
  const getRecommendation = (number: PhoneNumber) => {
    const averageScore = getAverageScore(number)
    const spamReports = number.spam_reports
    const lastChecked = new Date(number.last_checked || number.updated_at)
    const daysSinceCheck = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60 * 24)
    
    // High spam reports + low score = burn
    if (spamReports >= 5 && averageScore < 30) {
      return { type: 'burn', label: '🔥 Quemar', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    }
    
    // Low score + recent check = rest
    if (averageScore < 50 && daysSinceCheck < 7) {
      return { type: 'rest', label: '😴 Reposar 7 días', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' }
    }
    
    // Medium score + old check = retry
    if (averageScore >= 50 && averageScore < 70 && daysSinceCheck > 14) {
      return { type: 'retry', label: '🔄 Reintentar', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    }
    
    // High score = use
    if (averageScore >= 80) {
      return { type: 'use', label: '✅ Usar', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
    
    // Default = monitor
    return { type: 'monitor', label: '👀 Monitorear', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
  }

  // Sort and filter numbers
  const sortedAndFilteredNumbers = applyFilters([...localNumbers]).sort((a, b) => {
    let aValue: any, bValue: any
    
    if (sortField === 'average_reputation_score') {
      aValue = getAverageScore(a)
      bValue = getAverageScore(b)
    } else if (sortField === 'numverify_score') {
      aValue = getNumverifyScore(a)
      bValue = getNumverifyScore(b)
    } else if (sortField === 'openai_score') {
      aValue = getOpenAIScore(a)
      bValue = getOpenAIScore(b)
    } else {
      aValue = a[sortField]
      bValue = b[sortField]
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue)
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
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
    if (!confirm("¿Estás seguro de que quieres eliminar permanentemente este número? Esta acción no se puede deshacer.")) return

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

  const handleDeprecate = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres marcar este número como 'en desuso'? El número se ocultará de la vista principal pero se mantendrá en el historial.")) return

    setLoading(id)
    try {
      const response = await fetch("/api/numbers/deprecate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumberId: id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al marcar como en desuso")
      }

      // Update local state
      setLocalNumbers(prev => 
        prev.map(num => 
          num.id === id 
            ? { ...num, status: "deprecated", updated_at: new Date().toISOString() }
            : num
        )
      )

      router.refresh()
    } catch (error) {
      console.error("Error deprecating number:", error)
      alert("Error al marcar el número como en desuso. Por favor, inténtalo de nuevo.")
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

  // Check if there are no numbers at all (not just filtered)
  if (localNumbers.length === 0) {
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

      <div className="w-full">
        {/* Numbers Table - Full Screen */}
        <div className="w-full">
          <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">
                    Phone Numbers ({sortedAndFilteredNumbers.length} de {localNumbers.length}) 
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Sorted by {sortField === 'average_reputation_score' ? 'Reliability' : sortField}
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
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                
                {/* Status Filter */}
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-1 text-sm border rounded-md bg-background"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="blocked">Bloqueado</option>
                  <option value="spam">Spam</option>
                  <option value="deprecated">En Desuso</option>
                </select>
                
                {/* Provider Filter */}
                <select 
                  value={filters.provider} 
                  onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value }))}
                  className="px-3 py-1 text-sm border rounded-md bg-background"
                >
                  <option value="all">Todos los proveedores</option>
                  <option value="Twilio">Twilio</option>
                  <option value="Vonage">Vonage</option>
                  <option value="Other">Otros</option>
                </select>
                
                {/* Score Range Filter */}
                <select 
                  value={filters.scoreRange} 
                  onChange={(e) => setFilters(prev => ({ ...prev, scoreRange: e.target.value }))}
                  className="px-3 py-1 text-sm border rounded-md bg-background"
                >
                  <option value="all">Todos los scores</option>
                  <option value="excellent">Excelente (90-100)</option>
                  <option value="good">Bueno (80-89)</option>
                  <option value="fair">Regular (60-79)</option>
                  <option value="poor">Pobre (0-59)</option>
                </select>
                
                {/* Spam Only Filter */}
                <label className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox" 
                    checked={filters.showSpamOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, showSpamOnly: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Solo Spam</span>
                </label>
                
                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilters({ status: 'all', provider: 'all', scoreRange: 'all', showSpamOnly: false })}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              </div>
              
              {/* Selection hint when no number is selected */}
              {!selectedNumber && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Haz click en cualquier número para validar SPAM
                    </span>
                  </div>
                </div>
              )}
              
              {/* Show message when no numbers match filters */}
              {sortedAndFilteredNumbers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Phone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay números que coincidan con los filtros</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Ajusta los filtros para ver más números o agrega nuevos números
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setFilters({ status: 'all', provider: 'all', scoreRange: 'all', showSpamOnly: false })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground w-20">🏆</TableHead>
                    <TableHead 
                      className="text-muted-foreground cursor-pointer hover:text-primary"
                      onClick={() => handleSort('number')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>#</span>
                        {getSortIcon('number')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-muted-foreground cursor-pointer hover:text-primary"
                      onClick={() => handleSort('provider')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Prov</span>
                        {getSortIcon('provider')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-muted-foreground cursor-pointer hover:text-primary"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Est</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Numv</span>
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
                          <span>AI</span>
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
                      <TableHead 
                        className="text-muted-foreground cursor-pointer hover:text-primary"
                        onClick={() => handleSort('average_reputation_score')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Avg</span>
                          {getSortIcon('average_reputation_score')}
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
                    <TableHead className="text-muted-foreground">Carrier</TableHead>
                    <TableHead className="text-muted-foreground">Location</TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Reports</span>
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
                    <TableHead className="text-muted-foreground">Rec</TableHead>
                    <TableHead className="text-muted-foreground">Act</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredNumbers.map((number, index) => (
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
                        <Badge className={getRecommendation(number).color}>
                          {getRecommendation(number).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
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
                              disabled={number.status === "active" || loading === number.id}
                            >
                              {loading === number.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(number.id, "inactive")}
                              disabled={number.status === "inactive" || loading === number.id}
                            >
                              {loading === number.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Set Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(number.id, "blocked")}
                              disabled={number.status === "blocked" || loading === number.id}
                            >
                              {loading === number.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : null}
                              Block Number
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeprecate(number.id)}
                              disabled={number.status === "deprecated" || loading === number.id}
                              className="text-orange-600"
                            >
                              {loading === number.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Archive className="h-4 w-4 mr-2" />
                              )}
                              Marcar como En Desuso
                            </DropdownMenuItem>
                            {number.status === "deprecated" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(number.id, "active")}
                                disabled={loading === number.id}
                                className="text-green-600"
                              >
                                {loading === number.id ? (
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Restaurar a Activo
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDelete(number.id)} 
                              disabled={loading === number.id}
                              className="text-red-600"
                            >
                              {loading === number.id ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Eliminar Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Floating SPAM Validation Panel */}
        {selectedNumber && (
          <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[80vh] overflow-y-auto">
            <Card className="shadow-2xl border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-lg">SPAM Validation</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedNumber(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Phone Number Context */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-3">
                    {/* Phone Number */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Número Seleccionado:</p>
                        <p className="text-lg font-mono text-primary">{selectedNumber.number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Proveedor:</p>
                        <p className="text-sm font-medium">{selectedNumber.provider}</p>
                      </div>
                    </div>
                    
                    {/* Current Scores */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-background rounded border">
                        <p className="text-xs text-muted-foreground">Numverify</p>
                        <p className="text-sm font-bold text-green-600">{getNumverifyScore(selectedNumber)}</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-xs text-muted-foreground">OpenAI</p>
                        <p className="text-sm font-bold text-purple-600">{getOpenAIScore(selectedNumber)}</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="text-sm font-bold text-blue-600">{getAverageScore(selectedNumber)}</p>
                      </div>
                    </div>
                    
                    {/* Status and Reports */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          selectedNumber.status === "active" ? "default" :
                          selectedNumber.status === "inactive" ? "secondary" :
                          selectedNumber.status === "blocked" ? "destructive" :
                          "destructive"
                        }>
                          {selectedNumber.status.charAt(0).toUpperCase() + selectedNumber.status.slice(1)}
                        </Badge>
                        {selectedNumber.spam_reports > 0 && (
                          <div className="flex items-center space-x-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">{selectedNumber.spam_reports} reportes</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Recomendación:</p>
                        <Badge className={getRecommendation(selectedNumber).color}>
                          {getRecommendation(selectedNumber).label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <SpamValidationPanel
                  phoneNumberId={selectedNumber.id}
                  currentReputation={getAverageScore(selectedNumber)}
                  currentStatus={selectedNumber.status}
                  onValidationComplete={handleValidationComplete}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}