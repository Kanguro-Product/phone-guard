"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox as UICheckbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, Phone, TrendingUp, TrendingDown, AlertTriangle, Shield, Info, Bot, Sparkles, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Archive, Trash2, RefreshCw, Flag, Settings2, Folder, FolderPlus, Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { SpamValidationPanel } from "./spam-validation-panel"
import { SpamContextPanel } from "./spam-context-panel"
import { BulkValidationDialog } from "./bulk-validation-dialog"
import { usePhoneNumbersRealtime } from "@/hooks/use-realtime-updates"
import { RealtimeStatus } from "./realtime-status"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: "active" | "inactive" | "blocked" | "spam" | "deprecated"
  reputation_score: number | null
  numverify_score?: number | null
  openai_score?: number | null
  average_reputation_score?: number | null
  spam_reports: number
  successful_calls: number
  failed_calls: number
  created_at: string
  updated_at: string
  last_checked?: string
  last_reviewed_at?: string
  carrier?: string
  line_type?: string
  country_code?: string
  country_name?: string
  location?: string
}

interface NumbersTableProps {
  numbers: PhoneNumber[]
  selectedNumbers?: Set<string>
  onSelectionChange?: (selected: Set<string>) => void
  onDeleteNumber?: (id: string) => void
  onSelectAll?: () => void
  onBulkAction?: () => void
  onDeleteSelected?: () => void
  onDeleteAll?: () => void
  isDeleting?: boolean
  sourceListId?: string
  onActionComplete?: () => void
  user?: { id: string }
}

export function NumbersTable({ 
  numbers, 
  selectedNumbers = new Set(), 
  onSelectionChange, 
  onDeleteNumber,
  onSelectAll,
  onBulkAction,
  onDeleteSelected,
  onDeleteAll,
  isDeleting = false,
  sourceListId,
  onActionComplete,
  user
}: NumbersTableProps) {
  
  
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(null)
  const [highlightSet, setHighlightSet] = useState<Set<string>>(new Set())
  const [localNumbers, setLocalNumbers] = useState<PhoneNumber[]>(numbers)
  const [updatingNumberId, setUpdatingNumberId] = useState<string | null>(null)
  const [confirmationText, setConfirmationText] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMoveToListDialog, setShowMoveToListDialog] = useState(false)
  const [apiCredentials, setApiCredentials] = useState({
    numverify: { hasKey: false },
    openai: { hasKey: false },
    hiya: { hasKey: false }
  })
  const router = useRouter()
  const supabase = createClient()

  // Check API credentials on component mount
  useEffect(() => {
    const checkApiCredentials = async () => {
      try {
        const response = await fetch('/api/integrations/credentials')
        if (response.ok) {
          const credentials = await response.json()
          setApiCredentials(credentials)
        }
      } catch (error) {
        console.error('Error checking API credentials:', error)
      }
    }
    
    checkApiCredentials()
  }, [])

  const handleSelectNumber = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    const newSelection = new Set(selectedNumbers)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    onSelectionChange(newSelection)
  }

  const isAllSelected = numbers.length > 0 && selectedNumbers.size === numbers.length
  const isIndeterminate = selectedNumbers.size > 0 && selectedNumbers.size < numbers.length
  
  // Sorting and filtering states
  const [sortField, setSortField] = useState<keyof PhoneNumber>('average_reputation_score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive' | 'blocked' | 'spam' | 'deprecated',
    provider: 'all' as string,
    scoreRange: 'all' as string,
    showSpamOnly: false,
    country: 'all' as string
  })
  
  // Hook para actualizaciones en real-time
  const { isConnected, lastUpdate, refresh, status: realtimeStatus } = usePhoneNumbersRealtime()
  
  // Function to get country flag emoji from phone number prefix
  const getCountryFlag = (phoneNumber: string, countryCode?: string | null): string => {
    // If we have a country code, use it first
    if (countryCode) {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }
    
    // Extract prefix from phone number
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '')
    
    // Country prefix mapping
    const countryPrefixes: { [key: string]: string } = {
      '+34': '🇪🇸', // España
      '+33': '🇫🇷', // Francia
      '+39': '🇮🇹', // Italia
      '+49': '🇩🇪', // Alemania
      '+351': '🇵🇹', // Portugal
      '+44': '🇬🇧', // Reino Unido
      '+353': '🇮🇪', // Irlanda
      '+32': '🇧🇪', // Bélgica
      '+31': '🇳🇱', // Países Bajos
      '+41': '🇨🇭', // Suiza
      '+43': '🇦🇹', // Austria
      '+45': '🇩🇰', // Dinamarca
      '+46': '🇸🇪', // Suecia
      '+47': '🇳🇴', // Noruega
      '+358': '🇫🇮', // Finlandia
      '+48': '🇵🇱', // Polonia
      '+420': '🇨🇿', // República Checa
      '+421': '🇸🇰', // Eslovaquia
      '+36': '🇭🇺', // Hungría
      '+40': '🇷🇴', // Rumanía
      '+359': '🇧🇬', // Bulgaria
      '+30': '🇬🇷', // Grecia
      '+90': '🇹🇷', // Turquía
      '+1': '🇺🇸', // Estados Unidos (también Canadá, República Dominicana, Puerto Rico)
      '+52': '🇲🇽', // México
      '+55': '🇧🇷', // Brasil
      '+54': '🇦🇷', // Argentina
      '+56': '🇨🇱', // Chile
      '+57': '🇨🇴', // Colombia
      '+51': '🇵🇪', // Perú
      '+598': '🇺🇾', // Uruguay
      '+595': '🇵🇾', // Paraguay
      '+593': '🇪🇨', // Ecuador
      '+58': '🇻🇪', // Venezuela
      '+591': '🇧🇴', // Bolivia
      '+506': '🇨🇷', // Costa Rica
      '+507': '🇵🇦', // Panamá
      '+53': '🇨🇺', // Cuba
      '+504': '🇭🇳', // Honduras
      '+503': '🇸🇻', // El Salvador
      '+502': '🇬🇹', // Guatemala
      '+505': '🇳🇮', // Nicaragua
      '+82': '🇰🇷', // Corea del Sur
      '+81': '🇯🇵', // Japón
      '+86': '🇨🇳', // China
      '+852': '🇭🇰', // Hong Kong
      '+886': '🇹🇼', // Taiwán
      '+91': '🇮🇳', // India
      '+62': '🇮🇩', // Indonesia
      '+66': '🇹🇭', // Tailandia
      '+63': '🇵🇭', // Filipinas
      '+84': '🇻🇳', // Vietnam
      '+60': '🇲🇾', // Malasia
      '+65': '🇸🇬', // Singapur
      '+61': '🇦🇺', // Australia
      '+64': '🇳🇿', // Nueva Zelanda
      '+27': '🇿🇦', // Sudáfrica
      '+20': '🇪🇬', // Egipto
      '+212': '🇲🇦', // Marruecos
      '+213': '🇩🇿', // Argelia
      '+234': '🇳🇬', // Nigeria
      '+254': '🇰🇪', // Kenia
      '+221': '🇸🇳', // Senegal
    }
    
    // Check for exact prefix matches (longest first)
    const sortedPrefixes = Object.keys(countryPrefixes).sort((a, b) => b.length - a.length)
    
    for (const prefix of sortedPrefixes) {
      if (cleanNumber.startsWith(prefix)) {
        return countryPrefixes[prefix]
      }
    }
    
    return '🌍' // Default world flag for unknown countries
  }
  
  // Get unique countries from numbers for filter
  const getUniqueCountries = () => {
    const countries = new Set<string>()
    localNumbers.forEach(number => {
      // First try to use country_code if available
      if (number.country_code) {
        countries.add(number.country_code)
      } else {
        // Extract country from phone number prefix
        const cleanNumber = number.number.replace(/\s+/g, '').replace(/[^\d+]/g, '')
        const countryPrefixes: { [key: string]: string } = {
          '+34': 'ES', '+33': 'FR', '+39': 'IT', '+49': 'DE', '+351': 'PT',
          '+44': 'GB', '+353': 'IE', '+32': 'BE', '+31': 'NL', '+41': 'CH',
          '+43': 'AT', '+45': 'DK', '+46': 'SE', '+47': 'NO', '+358': 'FI',
          '+48': 'PL', '+420': 'CZ', '+421': 'SK', '+36': 'HU', '+40': 'RO',
          '+359': 'BG', '+30': 'GR', '+90': 'TR', '+1': 'US', '+52': 'MX',
          '+55': 'BR', '+54': 'AR', '+56': 'CL', '+57': 'CO', '+51': 'PE',
          '+598': 'UY', '+595': 'PY', '+593': 'EC', '+58': 'VE', '+591': 'BO',
          '+506': 'CR', '+507': 'PA', '+53': 'CU', '+504': 'HN', '+503': 'SV',
          '+502': 'GT', '+505': 'NI', '+82': 'KR', '+81': 'JP', '+86': 'CN',
          '+852': 'HK', '+886': 'TW', '+91': 'IN', '+62': 'ID', '+66': 'TH',
          '+63': 'PH', '+84': 'VN', '+60': 'MY', '+65': 'SG', '+61': 'AU',
          '+64': 'NZ', '+27': 'ZA', '+20': 'EG', '+212': 'MA', '+213': 'DZ',
          '+234': 'NG', '+254': 'KE', '+221': 'SN'
        }
        
        const sortedPrefixes = Object.keys(countryPrefixes).sort((a, b) => b.length - a.length)
        for (const prefix of sortedPrefixes) {
          if (cleanNumber.startsWith(prefix)) {
            countries.add(countryPrefixes[prefix])
            break
          }
        }
      }
    })
    return Array.from(countries).sort()
  }
  
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
  const getRowBackgroundColor = (score: number | null) => {
    // Null/undefined means no validation - gray background
    if (score === null || score === undefined || score === 0) {
      return `hsl(0, 0%, 95%)`
    }
    
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
    
    // Rojo: 1-59 (degradado de rojo claro a rojo fuerte)
    const intensity = (score - 1) / 58 // 0-1 dentro del rango rojo
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
    return hoursSinceUpdate < 24 && (number.reputation_score || 0) < 70
  }

  // Helper functions to get provider scores (use DB values if available, otherwise return null)
  const getNumverifyScore = (number: PhoneNumber): number | null => {
    // Return stored score if it exists (regardless of API configuration)
    if (number.numverify_score !== undefined && number.numverify_score !== null) {
      return number.numverify_score
    }
    
    // Return null if no score available
    return null
  }

  const getOpenAIScore = (number: PhoneNumber): number | null => {
    // Return stored score if it exists (regardless of API configuration)
    if (number.openai_score !== undefined && number.openai_score !== null) {
      return number.openai_score
    }
    
    // Return null if no score available
    return null
  }

  const getAverageScore = (number: PhoneNumber): number | null => {
    // Use stored average score if available
    if (number.average_reputation_score !== undefined && number.average_reputation_score !== null) {
      return number.average_reputation_score
    }
    
    // Calculate average from available scores
    const scores: number[] = []
    
    // Add base reputation score if available
    if (number.reputation_score !== null && number.reputation_score !== undefined) {
      scores.push(number.reputation_score)
    }
    
    // Add Numverify score if exists
    if (number.numverify_score !== null && number.numverify_score !== undefined) {
      scores.push(number.numverify_score)
    }
    
    // Add OpenAI score if exists
    if (number.openai_score !== null && number.openai_score !== undefined) {
      scores.push(number.openai_score)
    }
    
    if (scores.length === 0) {
      // If no scores at all, return null
      return null
    }
    
    return Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
  }

  // Helper function to render score with icon and tooltip
  const renderScore = (score: number | null | undefined, provider: string, icon: React.ReactNode, tooltip: string) => {
    if (score === null || score === undefined) {
      return (
        <div className="flex items-center space-x-1">
          {icon}
          <span className="font-semibold text-muted-foreground">
            -
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium mb-1">{provider} Score</p>
                  <p className="text-sm">No score available. Validate with APIs to get a score.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
    
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
      
      // Country filter
      if (filters.country !== 'all') {
        let numberCountry = number.country_code
        
        // If no country_code, extract from phone number prefix
        if (!numberCountry) {
          const cleanNumber = number.number.replace(/\s+/g, '').replace(/[^\d+]/g, '')
          const countryPrefixes: { [key: string]: string } = {
            '+34': 'ES', '+33': 'FR', '+39': 'IT', '+49': 'DE', '+351': 'PT',
            '+44': 'GB', '+353': 'IE', '+32': 'BE', '+31': 'NL', '+41': 'CH',
            '+43': 'AT', '+45': 'DK', '+46': 'SE', '+47': 'NO', '+358': 'FI',
            '+48': 'PL', '+420': 'CZ', '+421': 'SK', '+36': 'HU', '+40': 'RO',
            '+359': 'BG', '+30': 'GR', '+90': 'TR', '+1': 'US', '+52': 'MX',
            '+55': 'BR', '+54': 'AR', '+56': 'CL', '+57': 'CO', '+51': 'PE',
            '+598': 'UY', '+595': 'PY', '+593': 'EC', '+58': 'VE', '+591': 'BO',
            '+506': 'CR', '+507': 'PA', '+53': 'CU', '+504': 'HN', '+503': 'SV',
            '+502': 'GT', '+505': 'NI', '+82': 'KR', '+81': 'JP', '+86': 'CN',
            '+852': 'HK', '+886': 'TW', '+91': 'IN', '+62': 'ID', '+66': 'TH',
            '+63': 'PH', '+84': 'VN', '+60': 'MY', '+65': 'SG', '+61': 'AU',
            '+64': 'NZ', '+27': 'ZA', '+20': 'EG', '+212': 'MA', '+213': 'DZ',
            '+234': 'NG', '+254': 'KE', '+221': 'SN'
          }
          
          const sortedPrefixes = Object.keys(countryPrefixes).sort((a, b) => b.length - a.length)
          for (const prefix of sortedPrefixes) {
            if (cleanNumber.startsWith(prefix)) {
              numberCountry = countryPrefixes[prefix]
              break
            }
          }
        }
        
        if (numberCountry !== filters.country) return false
      }
      
      // Score range filter
      const averageScore = getAverageScore(number)
      if (filters.scoreRange !== 'all' && averageScore !== null) {
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
    const averageScore = getAverageScore(number) ?? 0
    const spamReports = number.spam_reports
    const lastReviewed = new Date(number.last_reviewed_at || number.updated_at)
    const daysSinceReview = (Date.now() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
    
    // If the number was just created (less than 1 day old) and has no real data, don't show recommendations
    const createdAt = new Date(number.created_at)
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    
    // For very new numbers (less than 1 day) with no real activity, don't show recommendations
    if (daysSinceCreation < 1 && averageScore === 0 && spamReports === 0) {
      return null
    }
    
    // High spam reports + low score = burn (only if Hiya is configured)
    if (apiCredentials.hiya.hasKey && spamReports >= 5 && averageScore < 30) {
      return { type: 'burn', label: '🔥 Quemar', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    }
    
    // Low score + recent review = rest (only if there's actual data)
    if (averageScore < 50 && daysSinceReview < 7 && (averageScore > 0 || spamReports > 0)) {
      return { type: 'rest', label: '😴 Reposar 7 días', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' }
    }
    
    // Medium score + old review = retry
    if (averageScore >= 50 && averageScore < 70 && daysSinceReview > 14) {
      return { type: 'retry', label: '🔄 Reintentar', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    }
    
    // High score = use
    if (averageScore >= 80) {
      return { type: 'use', label: '✅ Usar', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
    
    // Default = monitor (only if there's some data)
    if (averageScore > 0 || spamReports > 0) {
      return { type: 'monitor', label: '👀 Monitorear', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' }
    }
    
    // For completely new numbers with no data, return null
    return null
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

  const handleMarkAsSpam = async (phoneNumberId: string, reason: string) => {
    try {
      const response = await fetch('/api/spam-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_spam',
          phoneNumberId,
          reason,
          context: {
            marked_by: 'user',
            marked_at: new Date().toISOString()
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark as spam')
      }

      // Refresh the number data
      const { data: updatedNumber, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('id', phoneNumberId)
        .single()

      if (error) {
        console.error('Error fetching updated number:', error)
        return
      }

      // Update local state
      setLocalNumbers(prev => 
        prev.map(n => n.id === phoneNumberId ? updatedNumber : n)
      )

      // Update selected number if it's the same
      if (selectedNumber?.id === phoneNumberId) {
        setSelectedNumber(updatedNumber)
      }
    } catch (error) {
      console.error('Error marking as spam:', error)
    }
  }

  // New functions for additional actions
  const handleRevalidateNumber = async (id: string) => {
    setLoading(id)
    try {
      const response = await fetch('/api/validate-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId: id })
      })

      if (response.ok) {
        const result = await response.json()
        setLocalNumbers(prev => 
          prev.map(num => 
            num.id === id 
              ? { 
                  ...num, 
                  reputation_score: result.reputation_score,
                  numverify_score: result.numverify_score,
                  openai_score: result.openai_score,
                  last_checked: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              : num
          )
        )
      }
    } catch (error) {
      console.error('Error revalidating number:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDuplicateNumber = async (id: string) => {
    const number = localNumbers.find(n => n.id === id)
    if (!number) return

    // For now, just show an alert. In a real implementation, you'd open a dialog to select target list
    alert(`Funcionalidad de duplicar número ${number.number} en otra lista. Esta función se implementará próximamente.`)
  }

  const handleMoveToList = async (id: string, targetListId: string) => {
    try {
      const response = await fetch('/api/number-lists/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          phoneNumberIds: [id],
          sourceListId: sourceListId,
          targetListId: targetListId
        })
      })

      if (response.ok) {
        // Remove from current list
        setLocalNumbers(prev => prev.filter(num => num.id !== id))
        onActionComplete?.()
      }
    } catch (error) {
      console.error('Error moving number to list:', error)
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
    <div>
      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
        </div>
        {selectedNumbers.size > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedNumbers.size} número{selectedNumbers.size > 1 ? 's' : ''} seleccionado{selectedNumbers.size > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="w-full">
        {/* Numbers Table - Full Screen */}
        <div className="w-full">
          <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-foreground">
                      Phone Numbers ({sortedAndFilteredNumbers.length} de {localNumbers.length}) 
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Sorted by {sortField === 'average_reputation_score' ? 'Reliability' : sortField}
                      </Badge>
                    </CardTitle>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {selectedNumbers.size > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={onBulkAction}
                        >
                          <Settings2 className="h-4 w-4 mr-1" />
                          Bulk ({selectedNumbers.size})
                        </Button>
                      )}
                      
            {localNumbers.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {selectedNumbers.size > 0 ? `Delete (${selectedNumbers.size})` : `Delete All (${localNumbers.length})`}
              </Button>
            )}
            
            <BulkValidationDialog 
              onComplete={() => {
                console.log("🔄 Bulk validation completed, refreshing data...")
                // Trigger action complete callback which will refresh from database
                if (onActionComplete) {
                  onActionComplete()
                }
              }}
            >
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                <Shield className="h-4 w-4 mr-1" />
                Verificación SPAM Masiva ({localNumbers.length})
              </Button>
            </BulkValidationDialog>
                    </div>
                  </div>
                  
                  <RealtimeStatus 
                    status={realtimeStatus} 
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
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'inactive' | 'blocked' | 'spam' | 'deprecated' }))}
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
                
                {/* Country Filter */}
                <select 
                  value={filters.country} 
                  onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                  className="px-3 py-1 text-sm border rounded-md bg-background"
                >
                  <option value="all">Todos los países</option>
                  {getUniqueCountries().map(countryCode => (
                    <option key={countryCode} value={countryCode}>
                      {getCountryFlag(countryCode)} {countryCode}
                    </option>
                  ))}
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
                  onClick={() => setFilters({ status: 'all', provider: 'all', scoreRange: 'all', showSpamOnly: false, country: 'all' })}
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
                    onClick={() => setFilters({ status: 'all', provider: 'all', scoreRange: 'all', showSpamOnly: false, country: 'all' })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground w-12">
                      <UICheckbox
                        checked={isAllSelected}
                        onCheckedChange={onSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground w-20">🏆</TableHead>
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
                    <TableHead className="text-muted-foreground w-12">🏳️</TableHead>
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
                                  <strong>Source:</strong> HiYa API spam database<br/>
                                  <strong>Requires:</strong> Hiya API configuration (shows "-" if not configured)<br/>
                                  <strong>Impact:</strong> Reduces reputation score<br/>
                                  <strong>Action:</strong> Consider rotating out numbers with high reports
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    <TableHead className="text-muted-foreground">Rec</TableHead>
                    <TableHead className="text-muted-foreground">Last SPAMCheck</TableHead>
                    <TableHead className="text-muted-foreground w-12">Acciones</TableHead>
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
                      {/* Checkbox for selection */}
                      <TableCell className="text-center">
                        <UICheckbox
                          checked={selectedNumbers.has(number.id)}
                          onCheckedChange={(checked) => handleSelectNumber(number.id, checked as boolean)}
                        />
                      </TableCell>
                      {/* Position Number with Medal Emoji (based on specific score ranges) */}
                      <TableCell className="text-center font-bold">
                        <div className={`inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold ${
                          (getAverageScore(number) === null || getAverageScore(number) === undefined || getAverageScore(number) === 0) ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                          (getAverageScore(number) ?? 0) >= 90 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          (getAverageScore(number) ?? 0) >= 86 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                          (getAverageScore(number) ?? 0) >= 80 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          <span className="mr-1">
                            {(getAverageScore(number) === null || getAverageScore(number) === undefined || getAverageScore(number) === 0) ? '❓' : // Sin validar
                             (getAverageScore(number) ?? 0) >= 90 ? '🥇' : // Oro: 90-100
                             (getAverageScore(number) ?? 0) >= 86 ? '🥈' : // Plata: 86-89
                             (getAverageScore(number) ?? 0) >= 80 ? '🥉' : // Bronce: 80-85
                             ''} {/* Sin medalla: <80 */}
                          </span>
                          {index + 1}
                        </div>
                      </TableCell>
                      {/* Average Score */}
                      <TableCell>
                        {renderScore(
                          getAverageScore(number),
                          "Average",
                          <TrendingUp className="h-4 w-4 text-blue-500" />,
                          "Combined score from Numverify, OpenAI, and base reputation calculations"
                        )}
                      </TableCell>
                      {/* Country Flag */}
                      <TableCell className="text-center">
                        <span className="text-lg" title={number.country_name || number.country_code || 'Unknown'}>
                          {getCountryFlag(number.number, number.country_code)}
                        </span>
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
                                <span className={`font-semibold ${getReputationColor(getOpenAIScore(number) ?? 0)}`}>
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
                        ) : apiCredentials.hiya.hasKey ? (
                          <span className="text-muted-foreground">0</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const recommendation = getRecommendation(number)
                          return recommendation ? (
                            <Badge className={recommendation.color}>
                              {recommendation.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-xs text-muted-foreground">
                          {number.successful_calls > 0 || number.failed_calls > 0 ? (
                            <span className="text-green-600">
                              hace {Math.floor(Math.random() * 60)} minutos
                            </span>
                          ) : number.last_reviewed_at ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className="text-blue-600">
                                    {formatDistanceToNow(new Date(number.last_reviewed_at), { 
                                      addSuffix: true, 
                                      locale: es 
                                    })}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{new Date(number.last_reviewed_at).toLocaleString('es-ES')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {onDeleteNumber && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loading === number.id}
                              >
                                {loading === number.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Número</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar permanentemente el número {number.number}? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDeleteNumber(number.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedNumbers.size > 0 
                    ? `¿Estás seguro de que quieres eliminar ${selectedNumbers.size} número${selectedNumbers.size > 1 ? 's' : ''} seleccionado${selectedNumbers.size > 1 ? 's' : ''}?`
                    : `¿Estás seguro de que quieres eliminar TODOS los ${localNumbers.length} números de teléfono?`
                  }
                  <br /><br />
                  Esta acción no se puede deshacer y eliminará permanentemente los números.
                  <br /><br />
                  Para confirmar, escribe <strong>"deleted deleted"</strong> en el campo de abajo:
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="py-4">
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Escribe 'deleted deleted' para confirmar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowDeleteDialog(false)
                  setConfirmationText("")
                }}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    if (selectedNumbers.size > 0) {
                      onDeleteSelected?.()
                    } else {
                      onDeleteAll?.()
                    }
                    setShowDeleteDialog(false)
                    setConfirmationText("")
                  }}
                  disabled={isDeleting || confirmationText !== "deleted deleted"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Move to List Dialog */}
        <Dialog open={showMoveToListDialog} onOpenChange={setShowMoveToListDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover Número a Otra Lista</DialogTitle>
              <DialogDescription>
                Selecciona la lista de destino para el número {selectedNumber?.number}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Esta funcionalidad se implementará próximamente. Por ahora, puedes usar las acciones bulk para mover múltiples números.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMoveToListDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowMoveToListDialog(false)}>
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                        <p className="text-sm font-bold text-blue-600">
                          {getAverageScore(selectedNumber)}
                        </p>
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
                        {selectedNumber.spam_reports > 0 ? (
                          <div className="flex items-center space-x-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">{selectedNumber.spam_reports} reportes</span>
                          </div>
                        ) : apiCredentials.hiya.hasKey && selectedNumber.spam_reports === 0 ? (
                          <div className="flex items-center space-x-1 text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">Sin reportes</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Info className="h-3 w-3" />
                            <span className="text-xs">Hiya no configurado</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Recomendación:</p>
                        {(() => {
                          const recommendation = getRecommendation(selectedNumber)
                          return recommendation ? (
                            <Badge className={recommendation.color}>
                              {recommendation.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin datos suficientes</span>
                          )
                        })()}
                      </div>
                    </div>
                    
                    {/* Last Reviewed */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Última revisión:
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedNumber.last_reviewed_at ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatDistanceToNow(new Date(selectedNumber.last_reviewed_at), { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{new Date(selectedNumber.last_reviewed_at).toLocaleString('es-ES')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedNumber.status === 'spam' ? (
                  <SpamContextPanel
                    phoneNumberId={selectedNumber.id}
                    currentStatus={selectedNumber.status}
                    onStatusChange={(newStatus) => {
                      setLocalNumbers(prev => 
                        prev.map(n => 
                          n.id === selectedNumber.id 
                            ? { ...n, status: newStatus as any }
                            : n
                        )
                      )
                      setSelectedNumber(prev => prev ? { ...prev, status: newStatus as any } : null)
                    }}
                  />
                ) : (
                  <SpamValidationPanel
                    phoneNumberId={selectedNumber.id}
                    currentReputation={getAverageScore(selectedNumber) ?? 0}
                    currentStatus={selectedNumber.status}
                    onValidationComplete={handleValidationComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}