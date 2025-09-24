"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MoreHorizontal, Phone, TrendingUp, TrendingDown, AlertTriangle, Shield, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { SpamValidationPanel } from "./spam-validation-panel"
import { BulkValidationDialog } from "./bulk-validation-dialog"

interface PhoneNumber {
  id: string
  number: string
  provider: string
  status: "active" | "inactive" | "blocked" | "spam"
  reputation_score: number
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
  const router = useRouter()
  const supabase = createClient()

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

  const handleValidationComplete = () => {
    console.log("[v0] Validation completed, refreshing table data")
    // Solo refrescar la página si es necesario, no automáticamente
    // Los resultados se mantendrán visibles hasta que el usuario los cierre
    router.refresh()
  }

  if (numbers.length === 0) {
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
                <CardTitle className="text-foreground">Phone Numbers ({numbers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Number</TableHead>
                      <TableHead className="text-muted-foreground">Provider</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span>Reputation</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">Reputation Score</p>
                                <p className="text-sm">Phone number reputation based on call performance and SPAM validation.</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  <strong>Range:</strong> 0-100 (higher is better)<br/>
                                  <strong>Factors:</strong> SPAM reports, call success rate, validation results<br/>
                                  <strong>Updates:</strong> After each call and SPAM check
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
                    {numbers.map((number) => (
                      <TableRow
                        key={number.id}
                        className={
                          (selectedNumber?.id === number.id ? "bg-muted " : "") +
                          (highlightSet.has(number.number) ? "ring-2 ring-yellow-400/60" : "")
                        }
                      >
                        <TableCell
                          className="font-mono text-foreground cursor-pointer hover:text-primary"
                          onClick={() => setSelectedNumber(number)}
                        >
                          {number.number}
                        </TableCell>
                        <TableCell className="text-foreground">{number.provider}</TableCell>
                        <TableCell>{getStatusBadge(number.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getReputationIcon(number.reputation_score)}
                            <span className={`font-semibold ${getReputationColor(number.reputation_score)}`}>
                              {number.reputation_score}
                            </span>
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
                currentReputation={selectedNumber.reputation_score}
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