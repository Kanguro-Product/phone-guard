"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Play, RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface Cadence {
  id: string
  name: string
  rotation_strategy: string
  is_active: boolean
}

interface CallSimulatorProps {
  cadences: Cadence[]
  onCallComplete?: () => void
}

export function CallSimulator({ cadences, onCallComplete }: CallSimulatorProps) {
  const [selectedCadence, setSelectedCadence] = useState("")
  const [destinationNumber, setDestinationNumber] = useState("")
  const [isGettingNumber, setIsGettingNumber] = useState(false)
  const [isLoggingCall, setIsLoggingCall] = useState(false)
  const [currentNumber, setCurrentNumber] = useState<any>(null)
  const [callResult, setCallResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const activeCadences = cadences.filter((c) => c.is_active)

  const handleGetNextNumber = async () => {
    if (!selectedCadence) {
      setError("Please select a cadence")
      return
    }

    setIsGettingNumber(true)
    setError(null)
    setCurrentNumber(null)

    try {
      console.log("[v0] Getting next number for cadence:", selectedCadence)

      const response = await fetch("/api/get-next-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cadenceId: selectedCadence }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get next number")
      }

      console.log("[v0] Got next number:", data.result)
      setCurrentNumber(data.result)
    } catch (err) {
      console.error("[v0] Error getting next number:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsGettingNumber(false)
    }
  }

  const handleSimulateCall = async (status: string) => {
    if (!currentNumber || !destinationNumber) {
      setError("Please get a phone number and enter destination")
      return
    }

    setIsLoggingCall(true)
    setError(null)
    setCallResult(null)

    try {
      console.log("[v0] Simulating call with status:", status)

      // Simulate call duration and cost based on status
      let duration = 0
      let cost = 0

      if (status === "success") {
        duration = Math.floor(Math.random() * 300) + 30 // 30-330 seconds
        cost = Math.round((duration / 60) * 0.02 * 100) / 100 // $0.02 per minute
      } else if (status === "failed" || status === "spam_detected") {
        duration = Math.floor(Math.random() * 10) + 5 // 5-15 seconds
        cost = 0.01 // Connection fee
      }

      const callData = {
        phoneNumberId: currentNumber.phoneNumberId,
        cadenceId: selectedCadence,
        destinationNumber,
        status,
        duration,
        cost,
        metadata: {
          simulatedCall: true,
          strategy: currentNumber.strategy,
          reason: currentNumber.reason,
        },
      }

      const response = await fetch("/api/log-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(callData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to log call")
      }

      console.log("[v0] Call logged successfully")

      setCallResult({
        status,
        duration,
        cost,
        phoneNumber: currentNumber.phoneNumber,
        destinationNumber,
      })

      onCallComplete?.()
    } catch (err) {
      console.error("[v0] Error logging call:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoggingCall(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "spam_detected":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Phone className="h-5 w-5" />
          <span>Call Simulator</span>
        </CardTitle>
        <CardDescription>Test the phone number rotation and call logging system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cadence Selection */}
        <div className="grid gap-2">
          <Label htmlFor="cadence" className="text-foreground">
            Select Cadence
          </Label>
          <Select value={selectedCadence} onValueChange={setSelectedCadence}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a cadence" />
            </SelectTrigger>
            <SelectContent>
              {activeCadences.map((cadence) => (
                <SelectItem key={cadence.id} value={cadence.id}>
                  {cadence.name} ({cadence.rotation_strategy})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Destination Number */}
        <div className="grid gap-2">
          <Label htmlFor="destination" className="text-foreground">
            Destination Number
          </Label>
          <Input
            id="destination"
            placeholder="+1234567890"
            value={destinationNumber}
            onChange={(e) => setDestinationNumber(e.target.value)}
          />
        </div>

        {/* Get Next Number */}
        <Button onClick={handleGetNextNumber} disabled={isGettingNumber || !selectedCadence} className="w-full">
          {isGettingNumber ? (
            <>
              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
              Getting Number...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Get Next Number
            </>
          )}
        </Button>

        {/* Current Number Display */}
        {currentNumber && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Selected Number</span>
              <Badge variant="outline">{currentNumber.strategy}</Badge>
            </div>
            <div className="font-mono text-lg text-foreground mb-1">{currentNumber.phoneNumber}</div>
            <div className="text-xs text-muted-foreground">{currentNumber.reason}</div>
            {currentNumber.metadata && (
              <div className="text-xs text-muted-foreground mt-1">
                Provider: {currentNumber.metadata.provider} • Reputation: {currentNumber.metadata.reputation}
              </div>
            )}
          </div>
        )}

        {/* Call Simulation Buttons */}
        {currentNumber && destinationNumber && (
          <div className="space-y-2">
            <Label className="text-foreground">Simulate Call Result</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSimulateCall("success")}
                disabled={isLoggingCall}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Success
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSimulateCall("failed")}
                disabled={isLoggingCall}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Failed
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSimulateCall("busy")}
                disabled={isLoggingCall}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                <Clock className="h-4 w-4 mr-2" />
                Busy
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSimulateCall("spam_detected")}
                disabled={isLoggingCall}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                SPAM
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoggingCall && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Play className="h-4 w-4 animate-pulse" />
            <span>Logging call...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Call Result */}
        {callResult && (
          <Alert>
            {getStatusIcon(callResult.status)}
            <AlertDescription>
              <div className="font-medium mb-1">Call Completed</div>
              <div className="text-sm space-y-1">
                <div>Status: {callResult.status.toUpperCase()}</div>
                <div>From: {callResult.phoneNumber}</div>
                <div>To: {callResult.destinationNumber}</div>
                {callResult.duration > 0 && <div>Duration: {formatDuration(callResult.duration)}</div>}
                {callResult.cost > 0 && <div>Cost: ${callResult.cost.toFixed(2)}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {activeCadences.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No active cadences found. Create and activate a cadence first.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
