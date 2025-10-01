"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Clock, X, Bot, Brain, Sparkles } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SpamValidationPanelProps {
  phoneNumberId: string
  currentReputation: number
  currentStatus: string
  onValidationComplete?: () => void
}

export function SpamValidationPanel({
  phoneNumberId,
  currentReputation,
  currentStatus,
  onValidationComplete,
}: SpamValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  
  // API selection state
  const [selectedAPIs, setSelectedAPIs] = useState({
    numverify: false,
    openai: false,
    hiya: false
  })
  
  // API quota/token state
  const [apiQuotas, setApiQuotas] = useState({
    numverify: { remaining: null, total: null, loading: false, hasCredentials: false },
    openai: { remaining: null, total: null, loading: false, hasCredentials: false },
    hiya: { remaining: null, total: null, loading: false, hasCredentials: false }
  })
  
  // API credentials state
  const [apiCredentials, setApiCredentials] = useState({
    numverify: { hasKey: false, hasSecret: false },
    openai: { hasKey: false, hasSecret: false },
    hiya: { hasKey: false, hasSecret: false }
  })
  
  // Use updated average score from validation result if available, otherwise use current reputation
  const displayReputation = validationResult?.updatedAverageScore ?? currentReputation
  const displayStatus = validationResult?.updatedStatus ?? currentStatus

  // Function to get API quota information
  const fetchApiQuotas = async () => {
    // Set loading state
    setApiQuotas(prev => ({
      numverify: { ...prev.numverify, loading: true },
      openai: { ...prev.openai, loading: true },
      hiya: { ...prev.hiya, loading: true }
    }))

    try {
      const response = await fetch("/api/integrations/quota", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const quotas = await response.json()
        setApiQuotas(prev => ({
          ...prev,
          ...quotas
        }))
      }
    } catch (error) {
      console.error("Error fetching API quotas:", error)
    }
  }

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

  // Fetch quotas and credentials on component mount
  useEffect(() => {
    fetchApiQuotas()
    checkApiCredentials()
  }, [])

  const handleValidate = async () => {
    setIsValidating(true)
    setError(null)
    setValidationResult(null)

    try {
      console.log("[v0] Starting SPAM validation for phone number:", phoneNumberId)

      const response = await fetch("/api/validate-spam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phoneNumberId,
          selectedAPIs 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Validation failed")
      }

      console.log("[v0] SPAM validation completed:", data)
      setValidationResult(data)
      setShowResults(true)

      if (onValidationComplete) {
        // Add a small delay to ensure database update is complete
        setTimeout(() => {
          onValidationComplete()
        }, 500)
      }

      // Refresh quotas after successful validation
      fetchApiQuotas()
    } catch (err) {
      console.error("[v0] SPAM validation error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsValidating(false)
    }
  }

  const getReputationColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getReputationIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="h-4 w-4 text-green-500" />
    if (score >= 60) return <Shield className="h-4 w-4 text-yellow-500" />
    return <ShieldAlert className="h-4 w-4 text-red-500" />
  }

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

  const handleCloseResults = () => {
    setShowResults(false)
    setValidationResult(null)
    setError(null)
  }

  // Helper function to get ChatGPT result
  const getChatGPTResult = () => {
    if (!validationResult?.validation?.providerResults) return null
    return validationResult.validation.providerResults.find((result: any) => result.provider === "ChatGPT")
  }

  // Helper function to get other provider results
  const getOtherProviderResults = () => {
    if (!validationResult?.validation?.providerResults) return []
    return validationResult.validation.providerResults.filter((result: any) => result.provider !== "ChatGPT")
  }

  // Helper function to get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "ChatGPT":
        return <Bot className="h-4 w-4 text-purple-500" />
      case "Hiya":
        return <Shield className="h-4 w-4 text-blue-500" />
      case "Numverify":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "TrueCaller":
        return <ShieldCheck className="h-4 w-4 text-orange-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Shield className="h-5 w-5" />
          <span>SPAM Validation</span>
        </CardTitle>
        <CardDescription>Check this phone number against SPAM databases and reputation services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
          validationResult ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 'bg-muted'
        }`}>
          <div className="flex items-center space-x-2">
            {getReputationIcon(displayReputation)}
            <span className="text-sm font-medium text-foreground">
              {validationResult ? "Updated Average Score" : "Current Average Score"}
            </span>
            {validationResult && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                ✓ Updated
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${getReputationColor(displayReputation)}`}>{displayReputation}</span>
            {getStatusBadge(displayStatus)}
            {validationResult && displayReputation !== currentReputation && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <span>{currentReputation}</span>
                <span>→</span>
                <span className="font-medium text-foreground">{displayReputation}</span>
              </div>
            )}
          </div>
        </div>

        {/* API Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-foreground">Seleccionar APIs para validación:</div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchApiQuotas}
              className="text-xs"
            >
              🔄 Actualizar Quotas
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="numverify" 
                checked={selectedAPIs.numverify}
                disabled={!apiCredentials.numverify.hasKey}
                onCheckedChange={(checked) => 
                  setSelectedAPIs(prev => ({ ...prev, numverify: checked as boolean }))
                }
              />
              <Label htmlFor="numverify" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.numverify.hasKey ? 'opacity-50' : ''}`}>
                {apiCredentials.numverify.hasKey ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>Numverify (Validación de Carrier)</span>
                {!apiCredentials.numverify.hasKey ? (
                  <Badge variant="destructive" className="text-xs">
                    Sin API Key
                  </Badge>
                ) : apiQuotas.numverify.loading ? (
                  <Badge variant="outline" className="text-xs">
                    ⏳ Cargando...
                  </Badge>
                ) : apiQuotas.numverify.remaining !== null && (
                  <Badge variant="outline" className="text-xs">
                    {apiQuotas.numverify.remaining === "N/A" ? "Límite mensual" : `${apiQuotas.numverify.remaining} restantes`}
                  </Badge>
                )}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="openai" 
                checked={selectedAPIs.openai}
                disabled={!apiCredentials.openai.hasKey}
                onCheckedChange={(checked) => 
                  setSelectedAPIs(prev => ({ ...prev, openai: checked as boolean }))
                }
              />
              <Label htmlFor="openai" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.openai.hasKey ? 'opacity-50' : ''}`}>
                {apiCredentials.openai.hasKey ? (
                  <Bot className="h-4 w-4 text-purple-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>OpenAI ChatGPT (Análisis IA)</span>
                {!apiCredentials.openai.hasKey ? (
                  <Badge variant="destructive" className="text-xs">
                    Sin API Key
                  </Badge>
                ) : apiQuotas.openai.loading ? (
                  <Badge variant="outline" className="text-xs">
                    ⏳ Cargando...
                  </Badge>
                ) : apiQuotas.openai.remaining !== null && (
                  <Badge variant="outline" className="text-xs">
                    {apiQuotas.openai.remaining}
                  </Badge>
                )}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="hiya" 
                checked={selectedAPIs.hiya}
                disabled={!apiCredentials.hiya.hasKey}
                onCheckedChange={(checked) => 
                  setSelectedAPIs(prev => ({ ...prev, hiya: checked as boolean }))
                }
              />
              <Label htmlFor="hiya" className={`flex items-center space-x-2 cursor-pointer ${!apiCredentials.hiya.hasKey ? 'opacity-50' : ''}`}>
                {apiCredentials.hiya.hasKey ? (
                  <Shield className="h-4 w-4 text-blue-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span>Hiya (Detección Avanzada)</span>
                {!apiCredentials.hiya.hasKey ? (
                  <Badge variant="destructive" className="text-xs">
                    Sin API Key
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Disponible
                  </Badge>
                )}
              </Label>
            </div>
          </div>
          
          {/* Validation info */}
        <div className="text-xs text-muted-foreground">
          {Object.values(selectedAPIs).filter(Boolean).length === 0 
            ? "⚠️ Selecciona al menos una API para continuar"
            : `✅ ${Object.values(selectedAPIs).filter(Boolean).length} API(s) seleccionada(s)`
          }
        </div>
        
        {/* Alert when no APIs have credentials */}
        {!apiCredentials.numverify.hasKey && !apiCredentials.openai.hasKey && !apiCredentials.hiya.hasKey && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>No hay APIs configuradas.</strong> Ve a la página de Integraciones para configurar tus API keys y poder validar números.
            </AlertDescription>
          </Alert>
        )}

        {/* API Usage Info with Progress Bars */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs font-medium text-foreground mb-3">📊 Estado de Licencias:</div>
          <div className="space-y-3">
            {/* Numverify Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Numverify</span>
                <span className="text-xs text-muted-foreground">
                  {apiCredentials.numverify.hasKey ? "Configurado" : "Sin API Key"}
                </span>
              </div>
              {apiCredentials.numverify.hasKey && (
                <div className="space-y-1">
                  <Progress value={75} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Límite mensual: 1,000 validaciones incluidas
                  </div>
                </div>
              )}
            </div>
            
            {/* OpenAI Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">OpenAI</span>
                <span className="text-xs text-muted-foreground">
                  {apiCredentials.openai.hasKey ? "Configurado" : "Sin API Key"}
                </span>
              </div>
              {apiCredentials.openai.hasKey && (
                <div className="space-y-1">
                  <Progress value={45} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Créditos: $0.03 por validación
                  </div>
                </div>
              )}
            </div>
            
            {/* Hiya Progress */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Hiya</span>
                <span className="text-xs text-muted-foreground">
                  {apiCredentials.hiya.hasKey ? "Configurado" : "Sin API Key"}
                </span>
              </div>
              {apiCredentials.hiya.hasKey && (
                <div className="space-y-1">
                  <Progress value={0} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    Disponible para uso
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Validation Button */}
        <Button 
          onClick={handleValidate} 
          disabled={isValidating || Object.values(selectedAPIs).filter(Boolean).length === 0} 
          className="w-full"
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Run SPAM Validation
            </>
          )}
        </Button>

        {/* Loading Progress */}
        {isValidating && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Checking with multiple SPAM databases...</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Bot className="h-3 w-3 text-purple-500" />
                <span>ChatGPT AI analyzing number patterns...</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3 text-blue-500" />
                <span>Checking reputation databases...</span>
              </div>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Validation Results */}
        {validationResult && showResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Validation Results</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseResults}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Alert variant={validationResult.validation.overallResult.isSpam ? "destructive" : "default"}>
              {validationResult.validation.overallResult.isSpam ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium mb-1">
                  {validationResult.validation.overallResult.isSpam ? "SPAM Detected" : "Number Appears Clean"}
                </div>
                <div className="text-sm">
                  Confidence: {Math.round(validationResult.validation.overallResult.confidence * 100)}%
                </div>
              </AlertDescription>
            </Alert>

            {/* Updated Reputation */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Updated Reputation</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{currentReputation} →</span>
                  <span className={`font-bold ${getReputationColor(validationResult.updatedReputation)}`}>
                    {validationResult.updatedReputation}
                  </span>
                </div>
              </div>
              <Progress value={validationResult.updatedReputation} className="w-full" />
            </div>

            {/* ChatGPT AI Analysis - Featured */}
            {getChatGPTResult() && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  <h4 className="text-sm font-medium text-foreground">AI Analysis by ChatGPT</h4>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getChatGPTResult().isSpam ? (
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <span className="font-medium text-foreground">
                        {getChatGPTResult().isSpam ? "SPAM Detected" : "Number Appears Clean"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getChatGPTResult().isSpam ? "destructive" : "secondary"} className="text-xs">
                        Confidence: {Math.round(getChatGPTResult().confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">Reputation Score:</span>
                      <span className="font-medium text-foreground">{getChatGPTResult().details.reputation}/100</span>
                    </div>
                    
                    {getChatGPTResult().details.category && (
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline" className="text-xs">
                          {getChatGPTResult().details.category}
                        </Badge>
                      </div>
                    )}
                    
                    {getChatGPTResult().details.reports > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">Reports:</span>
                        <span className="font-medium text-foreground">{getChatGPTResult().details.reports}</span>
                      </div>
                    )}
                  </div>
                  
                  {getChatGPTResult().details.analysis && (
                    <div className="mt-3 p-3 bg-white/50 dark:bg-black/20 rounded border">
                      <div className="flex items-start space-x-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">AI Analysis:</div>
                          <p className="text-sm text-foreground">{getChatGPTResult().details.analysis}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {getChatGPTResult().details.reason && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <strong>Reason:</strong> {getChatGPTResult().details.reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other Provider Results */}
            {getOtherProviderResults().length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Other Provider Results</h4>
                {getOtherProviderResults().map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <div className="flex items-center space-x-2">
                      {getProviderIcon(result.provider)}
                      <span className="font-medium text-foreground">{result.provider}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.isSpam ? (
                        <Badge variant="destructive" className="text-xs">
                          SPAM
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Clean
                        </Badge>
                      )}
                      <span className="text-muted-foreground">Rep: {result.details.reputation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Details */}
            {validationResult.validation.overallResult.details.reason && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium text-foreground mb-1">Details</h4>
                <p className="text-sm text-muted-foreground">
                  {validationResult.validation.overallResult.details.reason}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
