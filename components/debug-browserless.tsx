'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DebugBrowserless() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDebug = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    
    try {
      const response = await fetch('/api/debug-browserless')
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Error en debug')
      } else {
        setResult(data)
      }
      
    } catch (err) {
      console.error('Error during debug:', err)
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleDebug}
          disabled={loading}
          variant="outline"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          {loading ? '🔄 Debugging...' : '🔧 Debug Browserless'}
        </Button>
        
        {result && (
          <span className="text-sm text-gray-600">
            Debug completado: {result.debug.timestamp}
          </span>
        )}
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
          <AlertDescription className="text-red-800 dark:text-red-200">
            ❌ Error: {error}
          </AlertDescription>
        </Alert>
      )}

      {result && result.debug && (
        <div className="space-y-4">
          {/* Environment Variables */}
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <div className="space-y-2">
                <div className="font-semibold">🔧 Variables de Entorno:</div>
                <div className="text-sm space-y-1">
                  <div>BROWSERLESS_URL: {result.debug.envVars.BROWSERLESS_URL}</div>
                  <div>HIYA_EMAIL: {result.debug.envVars.HIYA_EMAIL}</div>
                  <div>HIYA_PASSWORD: {result.debug.envVars.HIYA_PASSWORD}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Test Results */}
          <Alert className="bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800">
            <AlertDescription className="text-gray-800 dark:text-gray-200">
              <div className="space-y-3">
                <div className="font-semibold">🧪 Resultados de Pruebas:</div>
                
                {result.debug.tests.map((test: any, index: number) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{test.test}:</span>
                      {test.status === 'PASS' && <span className="text-green-600">✅ PASS</span>}
                      {test.status === 'FAIL' && <span className="text-red-600">❌ FAIL</span>}
                      {test.status === 'TESTING' && <span className="text-yellow-600">🔄 TESTING</span>}
                    </div>
                    
                    {test.details && (
                      <div className="text-xs text-gray-600 mt-1">
                        {typeof test.details === 'object' ? (
                          <pre className="whitespace-pre-wrap">{JSON.stringify(test.details, null, 2)}</pre>
                        ) : (
                          test.details
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Errors */}
          {result.debug.errors && result.debug.errors.length > 0 && (
            <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="space-y-2">
                  <div className="font-semibold">❌ Errores Encontrados:</div>
                  <ul className="text-sm space-y-1">
                    {result.debug.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}
