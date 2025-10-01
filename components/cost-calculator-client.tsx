"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calculator, DollarSign, TrendingUp, Info, CheckCircle, AlertCircle, ExternalLink, Shield, Brain, Phone, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ApiCosts {
  numverify: {
    costPerRequest: number
    monthlyPlan: number
    requestsIncluded: number
  }
  openai: {
    costPerRequest: number
    costPer1kTokens: number
  }
  hiya: {
    costPerRequest: number
    estimatedMonthly: number
  }
}

interface CalculationResult {
  totalMonthly: number
  totalYearly: number
  costPerValidation: number
  breakdown: {
    numverify: number
    openai: number
    hiya: number
  }
}

export function CostCalculatorClient() {
  const [validationsPerMonth, setValidationsPerMonth] = useState(1000)
  const [validationsPerDay, setValidationsPerDay] = useState(50)
  const [bulkValidations, setBulkValidations] = useState(10)

  // Sincronizar validaciones por día con las mensuales
  const handleValidationsPerDayChange = (value: number) => {
    setValidationsPerDay(value)
    setValidationsPerMonth(value * 30) // Aproximación de 30 días por mes
  }

  // Sincronizar validaciones por mes con las diarias
  const handleValidationsPerMonthChange = (value: number) => {
    setValidationsPerMonth(value)
    setValidationsPerDay(Math.round(value / 30)) // Aproximación de 30 días por mes
  }
  const [selectedApis, setSelectedApis] = useState({
    numverify: true,
    openai: true,
    hiya: false
  })

  const apiCosts: ApiCosts = {
    numverify: {
      costPerRequest: 0.03,
      monthlyPlan: 29.99,
      requestsIncluded: 1000
    },
    openai: {
      costPerRequest: 0.02,
      costPer1kTokens: 0.03
    },
    hiya: {
      costPerRequest: 0.05,
      estimatedMonthly: 99.99
    }
  }

  const calculateCosts = (): CalculationResult => {
    let totalMonthly = 0
    let costPerValidation = 0
    const breakdown = {
      numverify: 0,
      openai: 0,
      hiya: 0
    }

    // Numverify calculation
    if (selectedApis.numverify) {
      if (validationsPerMonth <= apiCosts.numverify.requestsIncluded) {
        breakdown.numverify = apiCosts.numverify.monthlyPlan
      } else {
        const extraRequests = validationsPerMonth - apiCosts.numverify.requestsIncluded
        breakdown.numverify = apiCosts.numverify.monthlyPlan + (extraRequests * apiCosts.numverify.costPerRequest)
      }
      costPerValidation += apiCosts.numverify.costPerRequest
    }

    // OpenAI calculation
    if (selectedApis.openai) {
      breakdown.openai = validationsPerMonth * apiCosts.openai.costPerRequest
      costPerValidation += apiCosts.openai.costPerRequest
    }

    // Hiya calculation
    if (selectedApis.hiya) {
      breakdown.hiya = validationsPerMonth * apiCosts.hiya.costPerRequest
      costPerValidation += apiCosts.hiya.costPerRequest
    }

    totalMonthly = breakdown.numverify + breakdown.openai + breakdown.hiya

    return {
      totalMonthly,
      totalYearly: totalMonthly * 12,
      costPerValidation,
      breakdown
    }
  }

  const result = calculateCosts()

  const handleApiToggle = (api: keyof typeof selectedApis) => {
    setSelectedApis(prev => ({
      ...prev,
      [api]: !prev[api]
    }))
  }

  const getSavingsRecommendation = () => {
    if (validationsPerMonth < 500) {
      return {
        type: "info",
        message: "Para volúmenes bajos, considera usar solo Numverify + OpenAI para optimizar costes."
      }
    } else if (validationsPerMonth > 5000) {
      return {
        type: "success",
        message: "Con tu volumen, podrías negociar descuentos por volumen con los proveedores."
      }
    } else {
      return {
        type: "info",
        message: "Considera implementar caché para evitar validaciones repetidas y reducir costes."
      }
    }
  }

  const savings = getSavingsRecommendation()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculadora</TabsTrigger>
          <TabsTrigger value="providers">Proveedores</TabsTrigger>
          <TabsTrigger value="optimization">Optimización</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volumen de Uso</CardTitle>
                <CardDescription>Configura tu uso estimado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="validationsPerMonth">Validaciones por mes</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número total de números telefónicos que validarás cada mes. Incluye validaciones individuales y masivas.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="validationsPerMonth"
                    type="number"
                    value={validationsPerMonth}
                    onChange={(e) => handleValidationsPerMonthChange(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="validationsPerDay">Validaciones por día</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número promedio de validaciones que realizarás cada día. Útil para planificar el uso diario.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="validationsPerDay"
                    type="number"
                    value={validationsPerDay}
                    onChange={(e) => handleValidationsPerDayChange(Number(e.target.value))}
                    min="0"
                    step="10"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bulkValidations">Validaciones masivas por mes</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número de operaciones masivas que realizarás cada mes. Las validaciones masivas procesan múltiples números a la vez y son más eficientes.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="bulkValidations"
                    type="number"
                    value={bulkValidations}
                    onChange={(e) => setBulkValidations(Number(e.target.value))}
                    min="0"
                    step="1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">APIs Seleccionadas</CardTitle>
                <CardDescription>Elige qué APIs usar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Numverify</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>API que valida números telefónicos, identifica el operador, tipo de línea (móvil, fijo, VoIP) y ubicación. Esencial para verificar que los números sean válidos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">Validación de números</p>
                  </div>
                  <Button
                    variant={selectedApis.numverify ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleApiToggle('numverify')}
                  >
                    {selectedApis.numverify ? "Activado" : "Desactivado"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>OpenAI GPT-4</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inteligencia artificial que analiza patrones en números telefónicos para detectar spam, fraude y comportamientos sospechosos. Muy útil para casos complejos.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">Análisis inteligente</p>
                  </div>
                  <Button
                    variant={selectedApis.openai ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleApiToggle('openai')}
                  >
                    {selectedApis.openai ? "Activado" : "Desactivado"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label>Hiya</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Base de datos global de números de spam, robocalls y fraude. Identifica números ya reportados por usuarios como problemáticos. Máxima precisión.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground">Detección de spam</p>
                  </div>
                  <Button
                    variant={selectedApis.hiya ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleApiToggle('hiya')}
                  >
                    {selectedApis.hiya ? "Activado" : "Desactivado"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Costes por API</CardTitle>
                <CardDescription>Precios actuales (2024)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Numverify</span>
                  <Badge variant="secondary">$0.03/req</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">OpenAI GPT-4</span>
                  <Badge variant="secondary">$0.02/req</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hiya</span>
                  <Badge variant="secondary">$0.05/req</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Por validación</span>
                  <Badge variant="outline">${result.costPerValidation.toFixed(3)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen de Costes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Coste mensual</span>
                  <span className="text-2xl font-bold text-primary">${result.totalMonthly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Coste anual</span>
                  <span className="text-xl font-semibold">${result.totalYearly.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Coste por validación</span>
                  <span className="font-medium">${result.costPerValidation.toFixed(3)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Desglose por API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedApis.numverify && (
                  <div className="flex justify-between items-center">
                    <span>Numverify</span>
                    <span className="font-medium">${result.breakdown.numverify.toFixed(2)}</span>
                  </div>
                )}
                {selectedApis.openai && (
                  <div className="flex justify-between items-center">
                    <span>OpenAI</span>
                    <span className="font-medium">${result.breakdown.openai.toFixed(2)}</span>
                  </div>
                )}
                {selectedApis.hiya && (
                  <div className="flex justify-between items-center">
                    <span>Hiya</span>
                    <span className="font-medium">${result.breakdown.hiya.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Total</span>
                  <span>${result.totalMonthly.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Desglose Detallado y Argumentado
              </CardTitle>
              <CardDescription>Explicación paso a paso de cada coste con cálculos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Numverify Breakdown */}
              {selectedApis.numverify && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Numverify - ${result.breakdown.numverify.toFixed(2)}/mes
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="text-sm">
                      <strong>Plan base:</strong> $29.99/mes (incluye 1,000 validaciones)
                    </div>
                    <div className="text-sm">
                      <strong>Tu uso:</strong> {validationsPerMonth.toLocaleString()} validaciones/mes
                    </div>
                    {validationsPerMonth <= apiCosts.numverify.requestsIncluded ? (
                      <div className="text-sm text-green-600">
                        <strong>✅ Incluido en plan:</strong> No pagas extra (dentro del límite de 1,000)
                      </div>
                    ) : (
                      <div className="text-sm">
                        <strong>Validaciones extra:</strong> {validationsPerMonth - apiCosts.numverify.requestsIncluded} × $0.03 = ${((validationsPerMonth - apiCosts.numverify.requestsIncluded) * apiCosts.numverify.costPerRequest).toFixed(2)}
                      </div>
                    )}
                    <div className="text-sm font-medium">
                      <strong>Cálculo total:</strong> $29.99 + ${((validationsPerMonth - apiCosts.numverify.requestsIncluded) * apiCosts.numverify.costPerRequest).toFixed(2)} = ${result.breakdown.numverify.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* OpenAI Breakdown */}
              {selectedApis.openai && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    OpenAI GPT-4 - ${result.breakdown.openai.toFixed(2)}/mes
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="text-sm">
                      <strong>Precio por validación:</strong> $0.02 (promedio de tokens entrada/salida)
                    </div>
                    <div className="text-sm">
                      <strong>Tu uso:</strong> {validationsPerMonth.toLocaleString()} validaciones/mes
                    </div>
                    <div className="text-sm">
                      <strong>Cálculo:</strong> {validationsPerMonth.toLocaleString()} × $0.02 = ${result.breakdown.openai.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <em>Nota: El coste real puede variar según la complejidad del análisis (tokens utilizados)</em>
                    </div>
                  </div>
                </div>
              )}

              {/* Hiya Breakdown */}
              {selectedApis.hiya && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Hiya - ${result.breakdown.hiya.toFixed(2)}/mes
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="text-sm">
                      <strong>Precio por validación:</strong> $0.05 (acceso a base de datos global)
                    </div>
                    <div className="text-sm">
                      <strong>Tu uso:</strong> {validationsPerMonth.toLocaleString()} validaciones/mes
                    </div>
                    <div className="text-sm">
                      <strong>Cálculo:</strong> {validationsPerMonth.toLocaleString()} × $0.05 = ${result.breakdown.hiya.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <em>Nota: Para volúmenes altos, contacta para descuentos por volumen</em>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3">Resumen Total Mensual</h4>
                <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coste base (Numverify):</span>
                    <span>${selectedApis.numverify ? '29.99' : '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Validaciones extra (Numverify):</span>
                    <span>${selectedApis.numverify ? ((validationsPerMonth - apiCosts.numverify.requestsIncluded) * apiCosts.numverify.costPerRequest).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>OpenAI GPT-4:</span>
                    <span>${result.breakdown.openai.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hiya:</span>
                    <span>${result.breakdown.hiya.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total mensual:</span>
                    <span>${result.totalMonthly.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total anual:</span>
                    <span>${result.totalYearly.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Cost per validation explanation */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3">Coste por Validación</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="text-sm">
                    <strong>Explicación:</strong> Cada vez que validas un número, pagas por cada API activa:
                  </div>
                  <ul className="text-sm space-y-1 ml-4">
                    {selectedApis.numverify && <li>• Numverify: $0.03 por validación</li>}
                    {selectedApis.openai && <li>• OpenAI: $0.02 por validación</li>}
                    {selectedApis.hiya && <li>• Hiya: $0.05 por validación</li>}
                  </ul>
                  <div className="text-sm font-medium">
                    <strong>Total por validación:</strong> ${result.costPerValidation.toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <em>Con {validationsPerMonth.toLocaleString()} validaciones/mes, pagas ${result.totalMonthly.toFixed(2)}/mes</em>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rotation Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recomendaciones de Rotación y Validación
              </CardTitle>
              <CardDescription>Cuándo y con qué frecuencia validar y rotar números</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Usage Analysis */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Análisis de tu Uso Actual</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Validaciones por día</div>
                    <div className="text-2xl font-bold">{validationsPerDay}</div>
                    <div className="text-xs text-muted-foreground">Números únicos/día</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Validaciones por mes</div>
                    <div className="text-2xl font-bold">{validationsPerMonth.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Números únicos/mes</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Coste por validación</div>
                    <div className="text-2xl font-bold">${result.costPerValidation.toFixed(3)}</div>
                    <div className="text-xs text-muted-foreground">Por número validado</div>
                  </div>
                </div>
              </div>

              {/* Rotation Strategy Recommendations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Estrategia de Rotación Recomendada</h4>
                
                {/* High Volume Strategy */}
                {validationsPerMonth > 2000 && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">🚀 Estrategia de Alto Volumen</h5>
                    <div className="space-y-2 text-sm">
                      <div><strong>Frecuencia de validación:</strong> Cada 2-3 días</div>
                      <div><strong>Rotación de números:</strong> Semanal (cada 7 días)</div>
                      <div><strong>Validaciones diarias:</strong> {Math.ceil(validationsPerDay / 3)} números/día</div>
                      <div><strong>Coste estimado:</strong> ${(result.totalMonthly * 0.7).toFixed(2)}/mes (30% ahorro)</div>
                      <div className="text-muted-foreground">
                        <em>Con tu volumen, puedes permitirte validaciones más frecuentes para máxima precisión</em>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medium Volume Strategy */}
                {validationsPerMonth >= 500 && validationsPerMonth <= 2000 && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">⚖️ Estrategia de Volumen Medio</h5>
                    <div className="space-y-2 text-sm">
                      <div><strong>Frecuencia de validación:</strong> Cada 3-5 días</div>
                      <div><strong>Rotación de números:</strong> Cada 10-14 días</div>
                      <div><strong>Validaciones diarias:</strong> {Math.ceil(validationsPerDay / 4)} números/día</div>
                      <div><strong>Coste estimado:</strong> ${(result.totalMonthly * 0.8).toFixed(2)}/mes (20% ahorro)</div>
                      <div className="text-muted-foreground">
                        <em>Balance óptimo entre coste y precisión para tu volumen</em>
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Volume Strategy */}
                {validationsPerMonth < 500 && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h5 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">💰 Estrategia de Bajo Volumen</h5>
                    <div className="space-y-2 text-sm">
                      <div><strong>Frecuencia de validación:</strong> Semanal (cada 7 días)</div>
                      <div><strong>Rotación de números:</strong> Cada 2-3 semanas</div>
                      <div><strong>Validaciones diarias:</strong> {Math.ceil(validationsPerDay / 7)} números/día</div>
                      <div><strong>Coste estimado:</strong> ${(result.totalMonthly * 0.6).toFixed(2)}/mes (40% ahorro)</div>
                      <div className="text-muted-foreground">
                        <em>Máximo ahorro manteniendo calidad aceptable</em>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Recommendations */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Recomendaciones Detalladas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-medium">📅 Calendario de Validación</h5>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                      <div><strong>Lunes:</strong> Validar números de alta prioridad</div>
                      <div><strong>Miércoles:</strong> Validar números de prioridad media</div>
                      <div><strong>Viernes:</strong> Validar números de baja prioridad</div>
                      <div><strong>Domingo:</strong> Rotación semanal de números</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium">🎯 Criterios de Rotación</h5>
                    <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                      <div><strong>Reputación &lt; 60:</strong> Rotar inmediatamente</div>
                      <div><strong>Reputación 60-80:</strong> Monitorear de cerca</div>
                      <div><strong>Reputación &gt; 80:</strong> Mantener activo</div>
                      <div><strong>Spam detectado:</strong> Pausar y investigar</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Optimization */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Optimización de Costes</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <div className="text-sm">
                    <strong>💡 Estrategia inteligente:</strong> Valida solo números que realmente necesitan verificación
                  </div>
                  <div className="text-sm">
                    <strong>📊 Números a validar diariamente:</strong> {Math.ceil(validationsPerDay * 0.3)} (30% del total)
                  </div>
                  <div className="text-sm">
                    <strong>🔄 Números a rotar semanalmente:</strong> {Math.ceil(validationsPerMonth * 0.1)} (10% del total)
                  </div>
                  <div className="text-sm">
                    <strong>💰 Ahorro potencial:</strong> ${(result.totalMonthly * 0.3).toFixed(2)}/mes (70% del coste actual)
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Plan de Acción</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div className="text-sm">
                      <strong>Configura validaciones automáticas</strong> cada {validationsPerMonth > 2000 ? '2-3 días' : validationsPerMonth >= 500 ? '3-5 días' : '7 días'}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div className="text-sm">
                      <strong>Establece rotación automática</strong> cada {validationsPerMonth > 2000 ? '7 días' : validationsPerMonth >= 500 ? '10-14 días' : '2-3 semanas'}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div className="text-sm">
                      <strong>Implementa caché</strong> para evitar validaciones repetidas (ahorro del 60-80%)
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div className="text-sm">
                      <strong>Monitorea métricas</strong> de reputación y ajusta frecuencia según resultados
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Alert>
            {savings.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>
              {savings.message}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Numverify */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Numverify
                </CardTitle>
                <CardDescription>Validación de números telefónicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">¿Qué hace?</h4>
                  <p className="text-sm text-muted-foreground">
                    Valida números telefónicos, identifica el operador, tipo de línea (móvil, fijo, VoIP) y ubicación geográfica.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">¿Cuándo usarlo?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Validar números antes de agregarlos</li>
                    <li>• Identificar números VoIP (más propensos al spam)</li>
                    <li>• Verificar operador y ubicación</li>
                    <li>• Enriquecer datos de números</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Precios</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Plan Básico</span>
                      <span>$29.99/mes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>1,000 validaciones incluidas</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Extra</span>
                      <span>$0.03/validación</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documentación
                </Button>
              </CardContent>
            </Card>

            {/* OpenAI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  OpenAI GPT-4
                </CardTitle>
                <CardDescription>Análisis inteligente de patrones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">¿Qué hace?</h4>
                  <p className="text-sm text-muted-foreground">
                    Analiza patrones en números telefónicos para detectar spam, fraude y comportamientos sospechosos usando IA.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">¿Cuándo usarlo?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Detectar patrones de spam complejos</li>
                    <li>• Análisis de números internacionales</li>
                    <li>• Identificar números de telemarketing</li>
                    <li>• Validación avanzada de reputación</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Precios</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>GPT-4</span>
                      <span>$0.03/1K tokens entrada</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Respuesta</span>
                      <span>$0.06/1K tokens salida</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Por validación</span>
                      <span>~$0.02</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documentación
                </Button>
              </CardContent>
            </Card>

            {/* Hiya */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Hiya
                </CardTitle>
                <CardDescription>Detección avanzada de spam</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">¿Qué hace?</h4>
                  <p className="text-sm text-muted-foreground">
                    Base de datos global de números de spam, robocalls y fraude. Identifica números reportados por usuarios.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">¿Cuándo usarlo?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Validación de alta precisión</li>
                    <li>• Números ya reportados como spam</li>
                    <li>• Detección de robocalls</li>
                    <li>• Protección contra fraude</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Precios</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Por validación</span>
                      <span>$0.05</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Plan empresarial</span>
                      <span>Contactar</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Descuentos por volumen</span>
                      <span>Disponibles</span>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contactar ventas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Comparación de APIs */}
          <Card>
            <CardHeader>
              <CardTitle>Comparación de APIs</CardTitle>
              <CardDescription>Cuándo usar cada una</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">API</th>
                      <th className="text-left p-2">Mejor para</th>
                      <th className="text-left p-2">Precisión</th>
                      <th className="text-left p-2">Coste</th>
                      <th className="text-left p-2">Recomendación</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b">
                      <td className="p-2 font-medium">Numverify</td>
                      <td className="p-2">Validación básica, enriquecimiento</td>
                      <td className="p-2">Alta</td>
                      <td className="p-2">$0.03</td>
                      <td className="p-2">Siempre usar</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">OpenAI</td>
                      <td className="p-2">Análisis de patrones complejos</td>
                      <td className="p-2">Muy alta</td>
                      <td className="p-2">$0.02</td>
                      <td className="p-2">Para casos avanzados</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Hiya</td>
                      <td className="p-2">Detección de spam conocida</td>
                      <td className="p-2">Máxima</td>
                      <td className="p-2">$0.05</td>
                      <td className="p-2">Para máxima seguridad</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estrategias de Optimización</CardTitle>
                <CardDescription>Cómo reducir costes manteniendo calidad</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">1. Implementar Caché</h4>
                    <p className="text-sm text-muted-foreground">
                      Guarda resultados de validaciones para evitar consultas repetidas. Ahorro: 60-80% en números repetidos.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">2. Validación Inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Valida solo números nuevos o con cambios significativos. Reduce costes en 40-50%.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">3. Validación Masiva</h4>
                    <p className="text-sm text-muted-foreground">
                      Procesa múltiples números en una sola operación. Más eficiente que validaciones individuales.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">4. Frecuencia Adaptativa</h4>
                    <p className="text-sm text-muted-foreground">
                      Ajusta la frecuencia según la criticidad del número. Números de alta reputación requieren menos validaciones.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI y Beneficios</CardTitle>
                <CardDescription>Retorno de inversión de las validaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Reducción de Spam</h4>
                    <p className="text-sm text-muted-foreground">
                      Hasta 90% menos números marcados como spam, mejorando la reputación general.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Eficiencia de Campañas</h4>
                    <p className="text-sm text-muted-foreground">
                      Números validados tienen 3x más probabilidad de éxito en llamadas.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Ahorro en Infraestructura</h4>
                    <p className="text-sm text-muted-foreground">
                      Menos números bloqueados = menos rotación = menos costes de números nuevos.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Cumplimiento Normativo</h4>
                    <p className="text-sm text-muted-foreground">
                      Validaciones ayudan a cumplir regulaciones anti-spam y protegen la reputación.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recomendaciones por Volumen</CardTitle>
              <CardDescription>Configuraciones óptimas según tu uso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Volumen Bajo (&lt; 500/mes)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Solo Numverify</li>
                    <li>• OpenAI para casos especiales</li>
                    <li>• Coste: ~$15-30/mes</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Volumen Medio (500-2000/mes)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Numverify + OpenAI</li>
                    <li>• Caché implementado</li>
                    <li>• Coste: ~$50-100/mes</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Volumen Alto (&gt; 2000/mes)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Todas las APIs</li>
                    <li>• Validación masiva</li>
                    <li>• Negociar descuentos</li>
                    <li>• Coste: ~$150-300/mes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  )
}
