"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Clock, AlertTriangle, Save, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ActionNeededConfigProps {
  userId: string
  onConfigUpdate?: () => void
}

export function ActionNeededConfig({ userId, onConfigUpdate }: ActionNeededConfigProps) {
  const [hoursThreshold, setHoursThreshold] = useState<number>(24)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Load current configuration
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('action_needed_config')
          .select('hours_threshold')
          .eq('user_id', userId)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading config:', error)
          setError('Error al cargar la configuración')
          return
        }

        if (data) {
          setHoursThreshold(data.hours_threshold)
        }
      } catch (error) {
        console.error('Error in loadConfig:', error)
        setError('Error al cargar la configuración')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [userId, supabase])

  const handleSave = async () => {
    if (hoursThreshold < 1 || hoursThreshold > 168) { // Max 1 week
      toast({
        title: "Error de validación",
        description: "Las horas deben estar entre 1 y 168 (1 semana)",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('action_needed_config')
        .upsert({
          user_id: userId,
          hours_threshold: hoursThreshold,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        throw error
      }

      toast({
        title: "Configuración guardada",
        description: `Los números aparecerán en "Action Needed" después de ${hoursThreshold} horas sin verificación`,
      })

      if (onConfigUpdate) {
        onConfigUpdate()
      }
    } catch (error) {
      console.error('Error saving config:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorDetails = JSON.stringify(error, null, 2)
      
      setError(`Error al guardar: ${errorMessage}`)
      toast({
        title: "Error al guardar configuración",
        description: errorMessage,
        variant: "destructive"
      })
      
      console.log('Error details:', errorDetails)
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    if (onConfigUpdate) {
      onConfigUpdate()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración Action Needed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración Action Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">{error}</p>
                <p className="text-xs">Abre la consola del navegador (F12) para ver más detalles.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="hours-threshold" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horas de umbral
          </Label>
          <Input
            id="hours-threshold"
            type="number"
            min="1"
            max="168"
            value={hoursThreshold}
            onChange={(e) => setHoursThreshold(parseInt(e.target.value) || 24)}
            placeholder="24"
            className="max-w-32"
          />
          <p className="text-sm text-muted-foreground">
            Los números aparecerán en "Action Needed" si no han sido verificados en las últimas {hoursThreshold} horas.
            Rango: 1-168 horas (1 semana máximo).
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar Lista
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>¿Cómo funciona?</strong> Los números que no han sido verificados en las últimas {hoursThreshold} horas 
            aparecerán automáticamente en la lista "Action Needed" para que puedas revisarlos.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
