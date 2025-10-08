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

