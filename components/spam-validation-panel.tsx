"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Clock, X } from "lucide-react"

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
        body: JSON.stringify({ phoneNumberId }),
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
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            {getReputationIcon(currentReputation)}
            <span className="text-sm font-medium text-foreground">Current Reputation</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${getReputationColor(currentReputation)}`}>{currentReputation}</span>
            {getStatusBadge(currentStatus)}
          </div>
        </div>

        {/* Validation Button */}
        <Button onClick={handleValidate} disabled={isValidating} className="w-full">
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

            {/* Provider Results */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Provider Results</h4>
              {validationResult.validation.providerResults.map((result: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span className="font-medium text-foreground">{result.provider}</span>
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
