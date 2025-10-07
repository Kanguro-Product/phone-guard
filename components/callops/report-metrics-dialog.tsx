"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

interface Test {
  id: string
  test_key: string
  full_id: string
  variants: any[]
  iteration_index: number
  status: string
}

interface ReportMetricsDialogProps {
  children: React.ReactNode
  test: Test
  open: boolean
  onOpenChange: (open: boolean) => void
  onReported: () => void
}

interface MetricsData {
  llamadas_realizadas: number
  llamadas_contestadas: number
  leads_llamados: number
  leads_con_respuesta: number
  intentos_hasta_respuesta_promedio: number
  llamadas_colgadas: number
  duracion_total_contestadas_min: number
  numeros_totales: number
  numeros_con_spam: number
  vms_dejados: number
  callbacks_en_2h: number
  callbacks_en_24h: number
  c_ans_eur: number
  c_min_eur: number
  ttfa_median_min: number
}

const EMPTY_METRICS: MetricsData = {
  llamadas_realizadas: 0,
  llamadas_contestadas: 0,
  leads_llamados: 0,
  leads_con_respuesta: 0,
  intentos_hasta_respuesta_promedio: 0,
  llamadas_colgadas: 0,
  duracion_total_contestadas_min: 0,
  numeros_totales: 0,
  numeros_con_spam: 0,
  vms_dejados: 0,
  callbacks_en_2h: 0,
  callbacks_en_24h: 0,
  c_ans_eur: 0,
  c_min_eur: 0,
  ttfa_median_min: 0
}

export function ReportMetricsDialog({ children, test, open, onOpenChange, onReported }: ReportMetricsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [activeVariant, setActiveVariant] = useState(test.variants[0]?.id || 'A')
  
  // Metrics data for each variant
  const [variantMetrics, setVariantMetrics] = useState<Record<string, MetricsData>>(
    test.variants.reduce((acc, v) => {
      acc[v.id] = { ...EMPTY_METRICS }
      return acc
    }, {} as Record<string, MetricsData>)
  )

  // Calculate KPIs for a variant
  const calculateKPIs = (metrics: MetricsData) => {
    const kpis: any = {}

    // % llamadas respondidas
    kpis.pct_llamadas_respondidas = metrics.llamadas_realizadas > 0
      ? ((metrics.llamadas_contestadas / metrics.llamadas_realizadas) * 100).toFixed(1)
      : null

    // % leads que contestaron
    kpis.pct_leads_que_contestaron = metrics.leads_llamados > 0
      ? ((metrics.leads_con_respuesta / metrics.leads_llamados) * 100).toFixed(1)
      : null

    // % colgadas por lead
    kpis.pct_colgadas_por_lead = metrics.llamadas_contestadas > 0
      ? ((metrics.llamadas_colgadas / metrics.llamadas_contestadas) * 100).toFixed(1)
      : null

    // Duración media
    kpis.duracion_media_min = metrics.llamadas_contestadas > 0
      ? (metrics.duracion_total_contestadas_min / metrics.llamadas_contestadas).toFixed(2)
      : null

    // Spam rate
    kpis.spam_rate = metrics.numeros_totales > 0
      ? ((metrics.numeros_con_spam / metrics.numeros_totales) * 100).toFixed(1)
      : null

    // Callback rates
    kpis.callback_rate_2h = metrics.vms_dejados > 0
      ? ((metrics.callbacks_en_2h / metrics.vms_dejados) * 100).toFixed(1)
      : null

    kpis.callback_rate_24h = metrics.vms_dejados > 0
      ? ((metrics.callbacks_en_24h / metrics.vms_dejados) * 100).toFixed(1)
      : null

    // CLR (Cost per Lead Response)
    kpis.clr = metrics.leads_con_respuesta > 0
      ? (((metrics.c_ans_eur * metrics.llamadas_contestadas) + 
          (metrics.c_min_eur * metrics.duracion_total_contestadas_min)) / 
         metrics.leads_con_respuesta).toFixed(2)
      : null

    return kpis
  }

  // Update metrics for a variant
  const updateVariantMetrics = (variantId: string, field: keyof MetricsData, value: number) => {
    setVariantMetrics(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value
      }
    }))
  }

  // Validate metrics
  const validateMetrics = (): string[] => {
    const newErrors: string[] = []

    for (const [variantId, metrics] of Object.entries(variantMetrics)) {
      const variant = test.variants.find(v => v.id === variantId)
      const variantLabel = variant?.label || variantId

      if (metrics.llamadas_contestadas > metrics.llamadas_realizadas) {
        newErrors.push(`${variantLabel}: Answered calls cannot exceed total calls`)
      }

      if (metrics.leads_con_respuesta > metrics.leads_llamados) {
        newErrors.push(`${variantLabel}: Leads with response cannot exceed leads called`)
      }

      if (metrics.numeros_con_spam > metrics.numeros_totales) {
        newErrors.push(`${variantLabel}: Spam numbers cannot exceed total numbers`)
      }

      if (metrics.callbacks_en_2h > metrics.callbacks_en_24h) {
        newErrors.push(`${variantLabel}: 2h callbacks cannot exceed 24h callbacks`)
      }

      if (metrics.callbacks_en_24h > metrics.vms_dejados) {
        newErrors.push(`${variantLabel}: Callbacks cannot exceed voicemails left`)
      }

      // Check for negative numbers
      Object.entries(metrics).forEach(([field, value]) => {
        if (value < 0) {
          newErrors.push(`${variantLabel}: ${field} cannot be negative`)
        }
      })
    }

    return newErrors
  }

  // Handle submit
  const handleSubmit = async () => {
    const validationErrors = validateMetrics()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors([])

    try {
      // Submit metrics for each variant
      const promises = Object.entries(variantMetrics).map(async ([variantId, metrics]) => {
        const response = await fetch('/api/callops/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_key: test.test_key,
            iteration_index: test.iteration_index,
            variant_id: variantId,
            ...metrics
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `Failed to save metrics for variant ${variantId}`)
        }

        return response.json()
      })

      await Promise.all(promises)

      // Transition test to Finished
      await fetch(`/api/callops/tests/${test.full_id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finish' })
      })

      toast({
        title: "✅ Metrics Reported",
        description: "Test has been completed with all metrics recorded"
      })

      onReported()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Error reporting metrics:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to report metrics',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setVariantMetrics(
      test.variants.reduce((acc, v) => {
        acc[v.id] = { ...EMPTY_METRICS }
        return acc
      }, {} as Record<string, MetricsData>)
    )
    setErrors([])
    setActiveVariant(test.variants[0]?.id || 'A')
  }

  // Get current variant metrics
  const currentMetrics = variantMetrics[activeVariant] || EMPTY_METRICS
  const currentKPIs = calculateKPIs(currentMetrics)

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm()
      onOpenChange(newOpen)
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Report Test Metrics</DialogTitle>
          <DialogDescription>
            Enter the metrics collected during the test execution to generate KPIs and close the execution.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Variant Tabs */}
            <Tabs value={activeVariant} onValueChange={setActiveVariant}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${test.variants.length}, 1fr)` }}>
                {test.variants.map((variant: any) => (
                  <TabsTrigger key={variant.id} value={variant.id}>
                    Variant {variant.id}: {variant.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {test.variants.map((variant: any) => (
                <TabsContent key={variant.id} value={variant.id} className="space-y-6">
                  {/* Base Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Base Metrics - Variant {variant.label}</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calls Made</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.llamadas_realizadas}
                          onChange={(e) => updateVariantMetrics(variant.id, 'llamadas_realizadas', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Calls Answered</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.llamadas_contestadas}
                          onChange={(e) => updateVariantMetrics(variant.id, 'llamadas_contestadas', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Leads Called</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.leads_llamados}
                          onChange={(e) => updateVariantMetrics(variant.id, 'leads_llamados', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Leads with Response</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.leads_con_respuesta}
                          onChange={(e) => updateVariantMetrics(variant.id, 'leads_con_respuesta', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Avg Attempts to Response</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={currentMetrics.intentos_hasta_respuesta_promedio}
                          onChange={(e) => updateVariantMetrics(variant.id, 'intentos_hasta_respuesta_promedio', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Hang-ups</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.llamadas_colgadas}
                          onChange={(e) => updateVariantMetrics(variant.id, 'llamadas_colgadas', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total Duration (min)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={currentMetrics.duracion_total_contestadas_min}
                          onChange={(e) => updateVariantMetrics(variant.id, 'duracion_total_contestadas_min', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total Numbers Used</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.numeros_totales}
                          onChange={(e) => updateVariantMetrics(variant.id, 'numeros_totales', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Numbers with Spam</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.numeros_con_spam}
                          onChange={(e) => updateVariantMetrics(variant.id, 'numeros_con_spam', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Voicemails Left</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.vms_dejados}
                          onChange={(e) => updateVariantMetrics(variant.id, 'vms_dejados', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Callbacks in 2h</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.callbacks_en_2h}
                          onChange={(e) => updateVariantMetrics(variant.id, 'callbacks_en_2h', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Callbacks in 24h</Label>
                        <Input
                          type="number"
                          min={0}
                          value={currentMetrics.callbacks_en_24h}
                          onChange={(e) => updateVariantMetrics(variant.id, 'callbacks_en_24h', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cost per Answer (€)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={currentMetrics.c_ans_eur}
                          onChange={(e) => updateVariantMetrics(variant.id, 'c_ans_eur', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cost per Minute (€)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.0001}
                          value={currentMetrics.c_min_eur}
                          onChange={(e) => updateVariantMetrics(variant.id, 'c_min_eur', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>TTFA Median (min) - Optional</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={currentMetrics.ttfa_median_min}
                          onChange={(e) => updateVariantMetrics(variant.id, 'ttfa_median_min', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Calculated KPIs */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Auto-Calculated KPIs</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Answer Rate</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.pct_llamadas_respondidas !== null ? `${currentKPIs.pct_llamadas_respondidas}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Lead Contact Rate</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.pct_leads_que_contestaron !== null ? `${currentKPIs.pct_leads_que_contestaron}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Hang-up Rate</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.pct_colgadas_por_lead !== null ? `${currentKPIs.pct_colgadas_por_lead}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Avg Duration</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.duracion_media_min !== null ? `${currentKPIs.duracion_media_min} min` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Spam Rate</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.spam_rate !== null ? `${currentKPIs.spam_rate}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Callback 2h</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.callback_rate_2h !== null ? `${currentKPIs.callback_rate_2h}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Callback 24h</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.callback_rate_24h !== null ? `${currentKPIs.callback_rate_24h}%` : '-'}
                        </div>
                      </div>

                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">CLR (Cost per Lead)</div>
                        <div className="text-2xl font-bold">
                          {currentKPIs.clr !== null ? `€${currentKPIs.clr}` : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Metrics & Finish Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
