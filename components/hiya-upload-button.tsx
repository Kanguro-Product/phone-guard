'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react'

export function HiyaUploadButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/hiya-upload', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Error al subir números')
      } else {
        setResult(data)
      }
      
    } catch (err) {
      console.error('Error during upload:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Numbers to Hiya
        </CardTitle>
        <CardDescription>
          Sube los números activos de tu base de datos a Hiya para tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-pulse" />
              Subiendo números...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Numbers to Hiya
            </>
          )}
        </Button>
        
        {/* Success message */}
        {result && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="space-y-1">
                <div><strong>¡Éxito!</strong> {result.message}</div>
                <div className="text-sm">
                  • Números subidos: {result.uploaded}
                </div>
                <div className="text-sm">
                  • Job name: {result.jobName}
                </div>
                <div className="text-sm">
                  • Duración: {(result.durationMs / 1000).toFixed(1)}s
                </div>
                <div className="text-xs mt-2 text-green-700">
                  💡 Los números tardarán unas horas en ser trackeados por Hiya. 
                  Después podrás ejecutar el scraping para obtener los resultados.
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
          <div>• Sube automáticamente todos los números activos de tu BD</div>
          <div>• Máximo 1,000 números por upload</div>
          <div>• Hiya tardará unas horas en trackearlos</div>
          <div>• Después ejecuta el scraping para ver resultados</div>
        </div>
      </CardContent>
    </Card>
  )
}

