"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Info,
  Calendar,
  User,
  Bot,
  Shield
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface SpamEvent {
  id: string
  event_type: 'detected' | 'resolved' | 'rotation_started' | 'rotation_completed'
  reason: string
  detected_by: 'api' | 'user' | 'automatic'
  context: any
  created_at: string
  resolved_at?: string
  resolution_reason?: string
}

interface RotationQueueItem {
  id: string
  rotation_type: string
  priority: number
  scheduled_at: string
  started_at?: string
  completed_at?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  error_message?: string
  context: any
}

interface SpamContextPanelProps {
  phoneNumberId: string
  currentStatus: string
  onStatusChange: (newStatus: string) => void
}

export function SpamContextPanel({ 
  phoneNumberId, 
  currentStatus, 
  onStatusChange 
}: SpamContextPanelProps) {
  const [spamEvents, setSpamEvents] = useState<SpamEvent[]>([])
  const [rotationQueue, setRotationQueue] = useState<RotationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rotating, setRotating] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (phoneNumberId) {
      fetchSpamContext()
    }
  }, [phoneNumberId])

  const fetchSpamContext = async () => {
    try {
      setLoading(true)
      
      // Fetch spam events
      const { data: events, error: eventsError } = await supabase
        .from('spam_events')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .order('created_at', { ascending: false })

      if (eventsError) {
        console.error('Error fetching spam events:', eventsError)
      } else {
        setSpamEvents(events || [])
      }

      // Fetch rotation queue
      const { data: queue, error: queueError } = await supabase
        .from('rotation_queue')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .order('scheduled_at', { ascending: false })

      if (queueError) {
        console.error('Error fetching rotation queue:', queueError)
      } else {
        setRotationQueue(queue || [])
      }
    } catch (error) {
      console.error('Error fetching spam context:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartRotation = async () => {
    try {
      setRotating(true)
      
      // Add to rotation queue
      const { error } = await supabase
        .from('rotation_queue')
        .insert({
          phone_number_id: phoneNumberId,
          rotation_type: 'manual_rotation',
          priority: 1,
          context: {
            initiated_by: 'user',
            reason: 'Manual rotation request'
          }
        })

      if (error) {
        console.error('Error adding to rotation queue:', error)
        return
      }

      // Update phone number status
      const { error: updateError } = await supabase
        .from('phone_numbers')
        .update({ 
          status: 'inactive',
          rotation_protocol: 'immediate'
        })
        .eq('id', phoneNumberId)

      if (updateError) {
        console.error('Error updating phone number:', updateError)
        return
      }

      onStatusChange('inactive')
      await fetchSpamContext()
    } catch (error) {
      console.error('Error starting rotation:', error)
    } finally {
      setRotating(false)
    }
  }

  const handleResolveSpam = async () => {
    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ 
          status: 'active',
          spam_resolved_at: new Date().toISOString(),
          spam_resolution_reason: 'Manually resolved by user'
        })
        .eq('id', phoneNumberId)

      if (error) {
        console.error('Error resolving spam:', error)
        return
      }

      onStatusChange('active')
      await fetchSpamContext()
    } catch (error) {
      console.error('Error resolving spam:', error)
    }
  }

  const getDetectedByIcon = (detectedBy: string) => {
    switch (detectedBy) {
      case 'api': return <Bot className="h-4 w-4" />
      case 'user': return <User className="h-4 w-4" />
      case 'automatic': return <Shield className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getDetectedByLabel = (detectedBy: string) => {
    switch (detectedBy) {
      case 'api': return 'API Detection'
      case 'user': return 'Manual Report'
      case 'automatic': return 'Automatic Detection'
      default: return 'Unknown'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 2: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Contexto de Spam
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Cargando contexto...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const latestSpamEvent = spamEvents.find(event => event.event_type === 'detected' && !event.resolved_at)
  const pendingRotations = rotationQueue.filter(item => item.status === 'pending' || item.status === 'in_progress')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Contexto de Spam
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStatus === 'spam' && latestSpamEvent ? (
          <>
            {/* Spam Detection Info */}
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Número marcado como spam
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Razón:</span>
                      <span>{latestSpamEvent.reason || 'No especificada'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Detectado por:</span>
                      <div className="flex items-center gap-1">
                        {getDetectedByIcon(latestSpamEvent.detected_by)}
                        <span>{getDetectedByLabel(latestSpamEvent.detected_by)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Fecha:</span>
                      <span>{formatDistanceToNow(new Date(latestSpamEvent.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}</span>
                    </div>
                    {latestSpamEvent.context && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border">
                        <span className="font-medium text-xs text-muted-foreground">Contexto adicional:</span>
                        <pre className="text-xs mt-1 whitespace-pre-wrap">
                          {JSON.stringify(latestSpamEvent.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rotation Queue */}
            {pendingRotations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Cola de Rotación
                </h4>
                {pendingRotations.map((rotation) => (
                  <div key={rotation.id} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(rotation.priority)}>
                          Prioridad {rotation.priority}
                        </Badge>
                        <Badge className={getStatusColor(rotation.status)}>
                          {rotation.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(rotation.scheduled_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </div>
                    </div>
                    {rotation.error_message && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                        Error: {rotation.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleStartRotation}
                disabled={rotating}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {rotating ? 'Rotando...' : 'Iniciar Rotación'}
              </Button>
              <Button 
                onClick={handleResolveSpam}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resolver Spam
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Este número no está marcado como spam
            </p>
          </div>
        )}

        {/* Spam History */}
        {spamEvents.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historial de Spam
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {spamEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-1 mt-0.5">
                      {event.event_type === 'detected' ? (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">
                          {event.event_type === 'detected' ? 'Detectado' : 'Resuelto'}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
