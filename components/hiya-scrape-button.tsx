"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Clock, CheckCircle, AlertTriangle, Database } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface LastScrapeInfo {
  last_run_at: string | null
  rows_count: number | null
  success: boolean | null
  minutes_since_last_run: number | null
}

export function HiyaScrapeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastScrape, setLastScrape] = useState<LastScrapeInfo | null>(null)
  const [totalNumbers, setTotalNumbers] = useState<number>(0)
  const [spamCount, setSpamCount] = useState<number>(0)
  
  const supabase = createClient()
  
  // Load last scrape info and stats on mount
  useEffect(() => {
    loadStats()
  }, [])
  
  const loadStats = async () => {
    try {
      // Get last scrape info
      const { data: lastScrapeData, error: lastScrapeError } = await supabase
        .rpc('get_last_hiya_scrape')
        .single()
      
      if (!lastScrapeError && lastScrapeData) {
        setLastScrape(lastScrapeData)
      }
      
      // Get total numbers count
      const { count: total } = await supabase
        .from('hiya_numbers')
        .select('*', { count: 'exact', head: true })
      
      setTotalNumbers(total || 0)
      
      // Get spam count
      const { count: spam } = await supabase
        .from('hiya_numbers')
        .select('*', { count: 'exact', head: true })
        .eq('is_spam', true)
      
      setSpamCount(spam || 0)
      
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }
  
  const handleScrape = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/hiya-scrape', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle rate limit
        if (response.status === 429) {
          setError(
            `${data.error} (Espera ${data.retryAfterMinutes || '?'} minuto${data.retryAfterMinutes !== 1 ? 's' : ''})`
          )
        } else {
          setError(data.error || 'Error desconocido')
          // Store debug info if available
          if (data.debug) {
            setResult({ error: true, debug: data.debug })
          }
        }
      } else {
        setResult(data)
        // Reload stats after successful scrape
        await loadStats()
      }
      
    } catch (err) {
      console.error('Error during scrape:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }
  
  const handlePreview = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/hiya-scrape?preview=true', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Error desconocido')
        // Store debug info if available
        if (data.debug) {
          setResult({ error: true, debug: data.debug })
        }
      } else {
        setResult(data)
      }
      
    } catch (err) {
      console.error('Error during preview:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleDiagnostic = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/hiya-scrape?diagnostic=true', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Error en diagnóstico')
      } else {
        setResult(data)
      }
      
    } catch (err) {
      console.error('Error during diagnostic:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Hiya Scraping
        </CardTitle>
        <CardDescription>
          Actualiza los datos de números trackeados desde tu cuenta de Hiya
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{totalNumbers}</div>
            <div className="text-sm text-muted-foreground">Números totales</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{spamCount}</div>
            <div className="text-sm text-muted-foreground">Marcados como spam</div>
          </div>
        </div>
        
        {/* Last scrape info */}
        {lastScrape && lastScrape.last_run_at && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 text-sm">
              <span className="font-medium">Última actualización:</span>{' '}
              {formatDistanceToNow(new Date(lastScrape.last_run_at), {
                addSuffix: true,
                locale: es
              })}
              {' '}
              ({lastScrape.rows_count || 0} filas)
            </div>
            {lastScrape.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleScrape}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar Datos de Hiya
              </>
            )}
          </Button>
          
          <Button
            onClick={handlePreview}
            disabled={loading}
            variant="outline"
          >
            Preview
          </Button>
          
          <Button
            onClick={handleDiagnostic}
            disabled={loading}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            🔍 Diagnóstico
          </Button>
        </div>
        
        {/* Result message */}
        {result && !result.preview && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>¡Éxito!</strong> Se actualizaron {result.checked} de {result.total} números
              {result.errors && ` (${result.errors.length} errores)`}
              {result.durationMs && ` en ${(result.durationMs / 1000).toFixed(1)}s`}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Preview result */}
        {result && result.preview && (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <div className="font-semibold">Modo Preview - Primera fila:</div>
                {result.firstRow ? (
                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result.firstRow, null, 2)}
                  </pre>
                ) : (
                  <div>No se encontraron filas</div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  💡 Usa esta información para ajustar los selectores en SELECTORS (api/hiya-scrape/route.ts)
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic result */}
        {result && result.diagnostic && (
          <Alert className="bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800">
            <AlertDescription className="text-purple-800 dark:text-purple-200">
              <div className="space-y-3">
                <div className="font-semibold">🔍 Diagnóstico del Sistema:</div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Variables de entorno:</span>
                    {result.diagnostic.envVars ? (
                      <span className="text-green-600">✅ Configuradas</span>
                    ) : (
                      <span className="text-red-600">❌ Faltan variables</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Browserless URL:</span>
                    {result.diagnostic.browserlessUrl ? (
                      <span className="text-green-600">✅ Válida</span>
                    ) : (
                      <span className="text-red-600">❌ No configurada</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Credenciales Hiya:</span>
                    {result.diagnostic.hiyaCredentials ? (
                      <span className="text-green-600">✅ Configuradas</span>
                    ) : (
                      <span className="text-red-600">❌ Faltan credenciales</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Conexión Browserless:</span>
                    {result.diagnostic.browserlessConnection ? (
                      <span className="text-green-600">✅ Conectado</span>
                    ) : (
                      <span className="text-red-600">❌ Error de conexión</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Base de datos:</span>
                    {result.diagnostic.database ? (
                      <span className="text-green-600">✅ Conectada</span>
                    ) : (
                      <span className="text-red-600">❌ Error de BD</span>
                    )}
                  </div>
                </div>

                {result.diagnostic.errors && result.diagnostic.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="font-medium text-red-600">❌ Errores encontrados:</div>
                    <ul className="text-xs mt-1 space-y-1">
                      {result.diagnostic.errors.map((error: string, index: number) => (
                        <li key={index} className="text-red-600">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

               {result.diagnostic.suggestions && result.diagnostic.suggestions.length > 0 && (
                 <div className="mt-3">
                   <div className="font-medium text-blue-600">💡 Sugerencias:</div>
                   <ul className="text-xs mt-1 space-y-1">
                     {result.diagnostic.suggestions.map((suggestion: string, index: number) => (
                       <li key={index} className="text-blue-600">• {suggestion}</li>
                     ))}
                   </ul>
                 </div>
               )}

               {result.diagnostic.detailedLogs && result.diagnostic.detailedLogs.length > 0 && (
                 <div className="mt-3">
                   <div className="font-medium text-gray-700">📋 Logs detallados:</div>
                   <div className="text-xs mt-1 space-y-1 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                     {result.diagnostic.detailedLogs.map((log: string, index: number) => (
                       <div key={index} className="text-gray-600">{log}</div>
                     ))}
                   </div>
                 </div>
               )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug info from error (login page debugging) */}
        {result && result.error && result.debug && (
          <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800">
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="space-y-3">
                <div className="font-semibold">🔍 Información de Debug:</div>
                
                {result.debug.pageInfo && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">URL:</span> {result.debug.pageInfo.url}
                    </div>
                    <div>
                      <span className="font-medium">Título:</span> {result.debug.pageInfo.title}
                    </div>
                    
                    {result.debug.pageInfo.inputs && result.debug.pageInfo.inputs.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">Campos de entrada encontrados ({result.debug.pageInfo.inputs.length}):</div>
                        <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded max-h-48 overflow-y-auto">
                          {result.debug.pageInfo.inputs.map((input: any, index: number) => (
                            <div key={index} className="mb-2 pb-2 border-b last:border-0">
                              <div>Type: <code className="bg-gray-100 px-1 rounded">{input.type}</code></div>
                              {input.name && <div>Name: <code className="bg-gray-100 px-1 rounded">{input.name}</code></div>}
                              {input.id && <div>ID: <code className="bg-gray-100 px-1 rounded">{input.id}</code></div>}
                              {input.placeholder && <div>Placeholder: {input.placeholder}</div>}
                              {input.className && <div>Class: <code className="bg-gray-100 px-1 rounded text-[10px]">{input.className}</code></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.debug.pageInfo.buttons && result.debug.pageInfo.buttons.length > 0 && (
                      <div>
                        <div className="font-medium mb-1">Botones encontrados ({result.debug.pageInfo.buttons.length}):</div>
                        <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
                          {result.debug.pageInfo.buttons.map((button: any, index: number) => (
                            <div key={index} className="mb-1">
                              • {button.text || '(sin texto)'} - Type: {button.type || 'button'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {result.debug.suggestions && result.debug.suggestions.length > 0 && (
                  <div>
                    <div className="font-medium">💡 Sugerencias:</div>
                    <ul className="text-sm space-y-1 mt-1">
                      {result.debug.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="text-orange-600">• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Límite: 200 filas por ejecución</div>
          <div>• Rate limit: 1 ejecución cada 5 minutos</div>
          <div>• Usa "Preview" para ver la primera fila sin escribir en BD</div>
        </div>
      </CardContent>
    </Card>
  )
}

