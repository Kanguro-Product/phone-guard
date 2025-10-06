"use client"

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertTriangle, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

interface ErrorDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  error: string
  details?: string
  title?: string
}

export function ErrorDetailsDialog({ 
  open, 
  onOpenChange, 
  error, 
  details, 
  title = "Error" 
}: ErrorDetailsDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyError = async () => {
    const errorText = `${title}: ${error}\n${details ? `Detalles: ${details}` : ''}`
    try {
      await navigator.clipboard.writeText(errorText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">

            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border">
              <p className="font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
              {details && (
                <details className="mt-2">
                  <summary className="text-sm text-red-600 dark:text-red-300 cursor-pointer hover:underline">
                    Ver detalles técnicos
                  </summary>
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-700 dark:text-red-300">
                    {details}
                  </div>
                </details>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              Si el problema persiste, puedes:
            </div>
            
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Refrescar la página e intentar nuevamente</li>
              <li>Verificar que tienes números seleccionados</li>
              <li>Comprobar que la lista de destino existe</li>
              <li>Copiar estos detalles de error si necesitas soporte técnico</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <button 
            onClick={handleCopyError}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            title="Copiar detalles del error"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar error
              </>
            )}
          </button>
          
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
