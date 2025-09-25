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
    numverify: true,
    openai: true,
    hiya: false // Disabled until coming soon
  })
  
  // API quota/token state
  const [apiQuotas, setApiQuotas] = useState({
    numverify: { remaining: null, total: null, loading: false },
    openai: { remaining: null, total: null, loading: false },
    hiya: { remaining: null, total: null, loading: false }
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

  // Fetch quotas on component mount
  useEffect(() => {
    fetchApiQuotas()
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
                onCheckedChange={(checked) => 
                  setSelectedAPIs(prev => ({ ...prev, numverify: checked as boolean }))
                }
              />
              <Label htmlFor="numverify" className="flex items-center space-x-2 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Numverify (Validación de Carrier)</span>
                {apiQuotas.numverify.loading ? (
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
                onCheckedChange={(checked) => 
                  setSelectedAPIs(prev => ({ ...prev, openai: checked as boolean }))
                }
              />
              <Label htmlFor="openai" className="flex items-center space-x-2 cursor-pointer">
                <Bot className="h-4 w-4 text-purple-500" />
                <span>OpenAI ChatGPT (Análisis IA)</span>
                {apiQuotas.openai.loading ? (
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
                checked={false}
                disabled={true}
                onCheckedChange={() => {}} // No-op since it's disabled
              />
              <Label htmlFor="hiya" className="flex items-center space-x-2 cursor-not-allowed opacity-60">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Hiya (Coming Soon)</span>
              </Label>
            </div>
          </div>
          
          {/* Validation info */}
        <div className="text-xs text-muted-foreground">
          {Object.values(selectedAPIs).filter(Boolean).length === 0 
            ? "⚠️ Selecciona al menos una API para continuar"
            : `${Object.values(selectedAPIs).filter(Boolean).length} API(s) seleccionada(s)`
          }
        </div>

        {/* API Usage Info */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-xs font-medium text-foreground mb-2">📊 Información de Uso:</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• <strong>Numverify:</strong> Límite mensual según plan</div>
            <div>• <strong>OpenAI:</strong> Basado en créditos ($)</div>
            <div>• <strong>Hiya:</strong> Próximamente disponible</div>
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
