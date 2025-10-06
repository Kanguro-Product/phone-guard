"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, RefreshCw, CheckCircle, AlertTriangle, ShieldAlert, X, Bot, Brain, Sparkles, Clock, Timer } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface BulkValidationDialogProps {
  children: React.ReactNode
  onComplete?: () => void
}

export function BulkValidationDialog({ children, onComplete }: BulkValidationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // API selection state
  const [selectedAPIs, setSelectedAPIs] = useState({
    numverify: false,
    openai: false,
    hiya: false
  })
  
  // API credentials state
  const [apiCredentials, setApiCredentials] = useState({
    numverify: { hasKey: false, hasSecret: false },
    openai: { hasKey: false, hasSecret: false },
    hiya: { hasKey: false, hasSecret: false }
  })
  
  // Progress tracking
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    startTime: null as Date | null,
    estimatedEndTime: null as Date | null,
    currentNumber: "",
    apiProgress: {
      numverify: 0,
      openai: 0,
      hiya: 0
    }
  })

  // Function to check API credentials
  const checkApiCredentials = async () => {
    try {
      const response = await fetch('/api/integrations/credentials')
      if (response.ok) {
        const credentials = await response.json()
        setApiCredentials(credentials)
        
        // Update selected APIs based on available credentials
        setSelectedAPIs(prev => ({
          numverify: prev.numverify && credentials.numverify.hasKey,
          openai: prev.openai && credentials.openai.hasKey,
          hiya: prev.hiya && credentials.hiya.hasKey
        }))
      }
    } catch (error) {
      console.error('Error checking API credentials:', error)
    }
  }

  // Function to get total numbers count
  const getTotalNumbers = async () => {
    try {
      const response = await fetch('/api/numbers/count')
      if (response.ok) {
        const data = await response.json()
        return data.count || 0
      }
    } catch (error) {
      console.error('Error getting numbers count:', error)
    }
    return 0
  }

  const handleBulkValidation = async () => {
    if (Object.values(selectedAPIs).filter(Boolean).length === 0) {
      setError("Selecciona al menos una API para continuar")
      return
    }

    setIsValidating(true)
    setError(null)
    setResults(null)

    // Get total numbers and start progress tracking
    const totalNumbers = await getTotalNumbers()
    const startTime = new Date()
    
    setProgress({
      current: 0,
      total: totalNumbers,
      startTime,
      estimatedEndTime: null,
      currentNumber: ""
    })

    try {
      console.log("[v0] Starting bulk SPAM validation with APIs:", selectedAPIs)

      const response = await fetch("/api/bulk-validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedAPIs: selectedAPIs
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Bulk validation failed")
      }

      console.log("[v0] Bulk validation completed:", data)
      setResults(data)

      // Reset progress
      setProgress(prev => ({
        ...prev,
        current: prev.total,
        estimatedEndTime: new Date()
      }))

      // Auto-close after 3 seconds and trigger refresh
      setTimeout(() => {
        setOpen(false)
        onComplete?.()
        // Reset state
        setTimeout(() => {
          setResults(null)
          setError(null)
          setProgress({
            current: 0,
            total: 0,
            startTime: null,
            estimatedEndTime: null,
            currentNumber: "",
            apiProgress: { numverify: 0, openai: 0, hiya: 0 }
          })
        }, 300)
      }, 3000)
    } catch (err) {
      console.error("[v0] Bulk validation error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsValidating(false)
    }
  }

  // Calculate estimated time remaining
  const getEstimatedTimeRemaining = () => {
    if (!progress.startTime || progress.current === 0) return null
    
    const elapsed = Date.now() - progress.startTime.getTime()
    const rate = progress.current / elapsed // numbers per ms
    const remaining = progress.total - progress.current
    const estimatedMs = remaining / rate
    
    return new Date(Date.now() + estimatedMs)
  }

  // Format time remaining
  const formatTimeRemaining = (endTime: Date) => {
    const remaining = endTime.getTime() - Date.now()
    if (remaining <= 0) return "Completado"
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const handleClose = () => {
    setOpen(false)
    setResults(null)
    setError(null)
    setIsValidating(false)
    setProgress({
      current: 0,
      total: 0,
      startTime: null,
      estimatedEndTime: null,
      currentNumber: ""
    })
  }

  // Load credentials when dialog opens
  useEffect(() => {
    if (open) {
      checkApiCredentials()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-foreground">
            <Shield className="h-5 w-5" />
            <span>Bulk SPAM Validation</span>
          </DialogTitle>
          <DialogDescription>
            Validate all your phone numbers against SPAM databases. This process may take several minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isValidating && !results && !error && (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This will check all your active phone numbers against multiple SPAM databases. The process respects API
                  rate limits and may take a few minutes to complete.
                </AlertDescription>
              </Alert>

              {/* API Selection */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Seleccionar APIs para validación:</div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bulk-numverify" 
                      checked={selectedAPIs.numverify}
                      disabled={!apiCredentials.numverify.hasKey}
                      onCheckedChange={(checked) => 
                        setSelectedAPIs(prev => ({ ...prev, numverify: checked as boolean }))
                      }
                    />
                    <Label htmlFor="bulk-numverify" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.numverify.hasKey ? 'opacity-50' : ''}`}>
                      {apiCredentials.numverify.hasKey ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>Numverify (Validación de Carrier)</span>
                      {!apiCredentials.numverify.hasKey && (
                        <Badge variant="destructive" className="text-xs">
                          Sin API Key
                        </Badge>
                      )}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bulk-openai" 
                      checked={selectedAPIs.openai}
                      disabled={!apiCredentials.openai.hasKey}
                      onCheckedChange={(checked) => 
                        setSelectedAPIs(prev => ({ ...prev, openai: checked as boolean }))
                      }
                    />
                    <Label htmlFor="bulk-openai" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.openai.hasKey ? 'opacity-50' : ''}`}>
                      {apiCredentials.openai.hasKey ? (
                        <Bot className="h-4 w-4 text-purple-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>OpenAI ChatGPT (Análisis IA)</span>
                      {!apiCredentials.openai.hasKey && (
                        <Badge variant="destructive" className="text-xs">
                          Sin API Key
                        </Badge>
                      )}
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bulk-hiya" 
                      checked={selectedAPIs.hiya}
                      disabled={!apiCredentials.hiya.hasKey}
                      onCheckedChange={(checked) => 
                        setSelectedAPIs(prev => ({ ...prev, hiya: checked as boolean }))
                      }
                    />
                    <Label htmlFor="bulk-hiya" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.hiya.hasKey ? 'opacity-50' : ''}`}>
                      {apiCredentials.hiya.hasKey ? (
                        <Shield className="h-4 w-4 text-blue-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                      <span>Hiya (Detección Avanzada)</span>
                      {!apiCredentials.hiya.hasKey && (
                        <Badge variant="destructive" className="text-xs">
                          Sin API Key
                        </Badge>
                      )}
                    </Label>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {Object.values(selectedAPIs).filter(Boolean).length === 0 
                    ? "⚠️ Selecciona al menos una API para continuar"
                    : `✅ ${Object.values(selectedAPIs).filter(Boolean).length} API(s) seleccionada(s)`}
                </div>
                
                {/* Alert when no APIs have credentials */}
                {!apiCredentials.numverify.hasKey && !apiCredentials.openai.hasKey && !apiCredentials.hiya.hasKey && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>No hay APIs configuradas.</strong> Ve a la página de Integraciones para configurar tus API keys.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Loading State with Real-time Progress */}
          {isValidating && (
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-sm font-medium">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                <span>Validando números telefónicos...</span>
              </div>
              
              {/* Main Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progreso Total</span>
                  <span className="text-blue-600 font-bold">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <Progress 
                  value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} 
                  className="w-full h-3" 
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  <span className="font-bold text-lg">
                    {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              {/* API Progress Breakdown */}
              {selectedAPIs.numverify && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Numverify</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {progress.apiProgress.numverify} checkeados
                    </span>
                  </div>
                  <Progress value={(progress.apiProgress.numverify / Math.max(progress.current, 1)) * 100} className="h-2" />
                </div>
              )}
              
              {selectedAPIs.openai && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">OpenAI ChatGPT</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {progress.apiProgress.openai} checkeados
                    </span>
                  </div>
                  <Progress value={(progress.apiProgress.openai / Math.max(progress.current, 1)) * 100} className="h-2 bg-purple-100" />
                </div>
              )}
              
              {selectedAPIs.hiya && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Hiya</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {progress.apiProgress.hiya} checkeados
                    </span>
                  </div>
                  <Progress value={(progress.apiProgress.hiya / Math.max(progress.current, 1)) * 100} className="h-2 bg-blue-100" />
                </div>
              )}
              
              {/* Time Estimation */}
              {progress.startTime && progress.current > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Transcurrido: {Math.round((Date.now() - progress.startTime.getTime()) / 1000)}s</span>
                  </div>
                  {getEstimatedTimeRemaining() && (
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4" />
                      <span className="font-medium">Resta: {formatTimeRemaining(getEstimatedTimeRemaining()!)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Current Number */}
              {progress.currentNumber && (
                <div className="text-xs text-center p-2 bg-blue-50 dark:bg-blue-950 rounded font-mono">
                  Procesando: <span className="font-bold">{progress.currentNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription>
                  <div className="font-bold text-lg mb-1 text-green-900 dark:text-green-100">✅ Validación Completada</div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    {results.message}
                    {results.spamDetected > 0 && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded">
                        <span className="text-red-700 dark:text-red-200 font-bold">⚠️ {results.spamDetected} números SPAM detectados</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    El diálogo se cerrará automáticamente en 3 segundos...
                  </div>
                </AlertDescription>
              </Alert>

              {/* Results Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {results.results.filter((r: any) => r.success && !r.isSpam).length}
                  </div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Números Limpios</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg text-center border-2 border-red-200 dark:border-red-800">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{results.spamDetected}</div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">SPAM Detectado</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                <h4 className="text-sm font-medium text-foreground">Detailed Results</h4>
                {results.results.map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <span className="font-mono text-foreground">{result.phoneNumber}</span>
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <>
                          {result.isSpam ? (
                            <Badge variant="destructive" className="text-xs">
                              SPAM
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Clean
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {result.oldReputation} → {result.newReputation}
                          </span>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!isValidating && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {results ? "Close" : "Cancel"}
              </Button>
              {!results && (
                <Button onClick={handleBulkValidation}>
                  <Shield className="h-4 w-4 mr-2" />
                  Start Validation
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
