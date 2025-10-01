"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface BulkUploadDialogProps {
  children: React.ReactNode
  userId: string
}

export function BulkUploadDialog({ children, userId }: BulkUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [validNumbers, setValidNumbers] = useState<string[]>([])
  const [invalidNumbers, setInvalidNumbers] = useState<string[]>([])
  const [hasValidated, setHasValidated] = useState(false)
  const [duplicateNumbers, setDuplicateNumbers] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  const validatePhoneNumbers = () => {
    const lines = phoneNumbers
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/

    const valid: string[] = []
    const invalid: string[] = []

    lines.forEach((line) => {
      // Clean the number (remove spaces, dashes, parentheses)
      const cleaned = line.replace(/[\s\-$$$$]/g, "")

      if (phoneRegex.test(cleaned)) {
        valid.push(cleaned)
      } else {
        invalid.push(line)
      }
    })

    setValidNumbers(valid.slice(0, 200)) // Limit to 200
    setInvalidNumbers(invalid)
    setHasValidated(true)
  }

  const handleUpload = async () => {
    if (validNumbers.length === 0) return

    setIsLoading(true)

    try {
      // Normalize numbers with leading + for comparison/insert
      const normalizedNumbers = validNumbers.map((n) => (n.startsWith("+") ? n : `+${n}`))

      // 1) Check duplicates already in DB for this user
      const { data: existing, error: existingError } = await supabase
        .from("phone_numbers")
        .select("number")
        .in("number", normalizedNumbers)
        .eq("user_id", userId)

      if (existingError) {
        throw existingError
      }

      const existingSet = new Set((existing || []).map((r) => r.number))
      const duplicates = normalizedNumbers.filter((n) => existingSet.has(n))

      if (duplicates.length > 0) {
        // Show alert instead of inserting
        setDuplicateNumbers(duplicates)
        setIsLoading(false)
        return
      }

      // 2) Proceed with insert if no duplicates
      const numbersToInsert = normalizedNumbers.map((number) => ({
        user_id: userId,
        number,
        provider: "Manual Upload",
        status: "active",
        reputation_score: null,
        created_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from("phone_numbers").insert(numbersToInsert)

      if (error) throw error

      // Reset form
      setPhoneNumbers("")
      setValidNumbers([])
      setInvalidNumbers([])
      setDuplicateNumbers([])
      setHasValidated(false)
      setIsOpen(false)

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error uploading numbers:", error)
      // Fallback: if unique violation escaped our pre-check
      const message = (error as { message?: string }).message || ""
      if (message.includes("duplicate") || message.includes("unique")) {
        setDuplicateNumbers(validNumbers.map((n) => (n.startsWith("+") ? n : `+${n}`)))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setPhoneNumbers("")
    setValidNumbers([])
    setInvalidNumbers([])
    setHasValidated(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Phone Numbers
          </DialogTitle>
          <DialogDescription>Upload up to 200 phone numbers at once. Paste one number per line.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-numbers">Phone Numbers</Label>
            <Textarea
              id="phone-numbers"
              placeholder={`+1234567890
+1987654321
555-123-4567
(555) 987-6543`}
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{phoneNumbers.split("\n").filter((line) => line.trim()).length} numbers entered</span>
              <span>Max: 200 numbers</span>
            </div>
          </div>

          {!hasValidated && phoneNumbers.trim() && (
            <Button onClick={validatePhoneNumbers} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Validate Numbers
            </Button>
          )}

          {hasValidated && (
            <div className="space-y-4">
              {validNumbers.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{validNumbers.length} valid numbers ready to upload</span>
                      <Badge variant="secondary">{validNumbers.length}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {duplicateNumbers.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>
                          {duplicateNumbers.length} numbers already exist in your account.
                        </span>
                        <Badge variant="destructive">{duplicateNumbers.length}</Badge>
                      </div>
                      <div className="text-xs">
                        <strong>Duplicates:</strong>
                        <div className="mt-1 max-h-20 overflow-y-auto bg-muted/50 p-2 rounded text-xs font-mono">
                          {duplicateNumbers.join(", ")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={async () => {
                            // Persist duplicates so Numbers page can highlight them
                            try {
                              localStorage.setItem("PG_HIGHLIGHT_NUMBERS", JSON.stringify(duplicateNumbers))
                            } catch {}
                            setIsOpen(false)
                            setDuplicateNumbers([])
                            // Refresh current page (Numbers) so data is visible and highlighted
                            await router.refresh()
                          }}
                          disabled={isLoading}
                        >
                          Recover from database
                        </Button>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            // Discard and enter new numbers
                            setPhoneNumbers("")
                            setValidNumbers([])
                            setInvalidNumbers([])
                            setDuplicateNumbers([])
                            setHasValidated(false)
                          }}
                          disabled={isLoading}
                        >
                          Discard and enter new numbers
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {invalidNumbers.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>{invalidNumbers.length} invalid numbers found</span>
                        <Badge variant="destructive">{invalidNumbers.length}</Badge>
                      </div>
                      <div className="text-xs">
                        <strong>Invalid numbers:</strong>
                        <div className="mt-1 max-h-20 overflow-y-auto bg-muted/50 p-2 rounded text-xs font-mono">
                          {invalidNumbers.join(", ")}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                  Reset
                </Button>
                <Button onClick={handleUpload} disabled={validNumbers.length === 0 || isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {validNumbers.length} Numbers
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Supported Formats:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• International format: +1234567890</li>
              <li>• With spaces: +1 234 567 890</li>
              <li>• With dashes: 234-567-890</li>
              <li>• With parentheses: (234) 567-890</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
