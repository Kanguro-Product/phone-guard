"use client"

import type React from "react"

import { useState } from "react"
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
import { Shield, RefreshCw, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react"

interface BulkValidationDialogProps {
  children: React.ReactNode
  onComplete?: () => void
}

export function BulkValidationDialog({ children, onComplete }: BulkValidationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleBulkValidation = async () => {
    setIsValidating(true)
    setError(null)
    setResults(null)

    try {
      console.log("[v0] Starting bulk SPAM validation")

      const response = await fetch("/api/bulk-validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Bulk validation failed")
      }

      console.log("[v0] Bulk validation completed:", data)
      setResults(data)
      onComplete?.()
    } catch (err) {
      console.error("[v0] Bulk validation error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsValidating(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setResults(null)
    setError(null)
  }

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
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This will check all your active phone numbers against multiple SPAM databases. The process respects API
                rate limits and may take a few minutes to complete.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isValidating && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Validating phone numbers...</span>
              </div>
              <Progress value={undefined} className="w-full" />
              <div className="text-xs text-muted-foreground text-center">
                Processing in batches to respect API limits. Please wait...
              </div>
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
              <Alert variant={results.spamDetected > 0 ? "destructive" : "default"}>
                {results.spamDetected > 0 ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertDescription>
                  <div className="font-medium mb-1">Validation Complete</div>
                  <div className="text-sm">
                    {results.message}
                    {results.spamDetected > 0 && (
                      <span className="text-red-600 font-medium"> • {results.spamDetected} SPAM numbers detected</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Results Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.results.filter((r: any) => r.success && !r.isSpam).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Clean Numbers</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{results.spamDetected}</div>
                  <div className="text-sm text-muted-foreground">SPAM Detected</div>
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
