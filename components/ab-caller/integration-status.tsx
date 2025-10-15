'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Wifi,
  Phone,
  Settings,
  RefreshCw
} from 'lucide-react'

interface IntegrationStatus {
  vonage: {
    connected: boolean
    lastTest: string | null
    status: 'connected' | 'disconnected' | 'error' | 'unknown'
  }
  n8n: {
    connected: boolean
    lastTest: string | null
    status: 'connected' | 'disconnected' | 'error' | 'unknown'
  }
  webhook: {
    configured: boolean
    url: string | null
    lastEvent: string | null
    status: 'active' | 'inactive' | 'error' | 'unknown'
  }
}

export function IntegrationStatus() {
  const [status, setStatus] = useState<IntegrationStatus>({
    vonage: { connected: false, lastTest: null, status: 'unknown' },
    n8n: { connected: false, lastTest: null, status: 'unknown' },
    webhook: { configured: false, url: null, lastEvent: null, status: 'unknown' }
  })
  const [isLoading, setIsLoading] = useState(false)

  const checkStatus = async () => {
    setIsLoading(true)
    
    try {
      // Check N8N connection
      const n8nResponse = await fetch('/api/ab-caller/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'login' })
      })
      
      const n8nResult = await n8nResponse.json()
      
      // Check webhook configuration
      const webhookResponse = await fetch('/api/ab-caller/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'webhook' })
      })
      
      const webhookResult = await webhookResponse.json()
      
      setStatus({
        vonage: {
          connected: n8nResult.success,
          lastTest: n8nResult.timestamp,
          status: n8nResult.success ? 'connected' : 'error'
        },
        n8n: {
          connected: n8nResult.success,
          lastTest: n8nResult.timestamp,
          status: n8nResult.success ? 'connected' : 'error'
        },
        webhook: {
          configured: webhookResult.success,
          url: 'http://localhost:3000/api/webhooks/vonage/events',
          lastEvent: webhookResult.timestamp,
          status: webhookResult.success ? 'active' : 'error'
        }
      })
    } catch (error) {
      console.error('Status check failed:', error)
      setStatus(prev => ({
        ...prev,
        vonage: { ...prev.vonage, status: 'error' },
        n8n: { ...prev.n8n, status: 'error' },
        webhook: { ...prev.webhook, status: 'error' }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disconnected':
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'disconnected':
      case 'inactive':
        return <Badge variant="destructive">Disconnected</Badge>
      case 'error':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const overallStatus = status.vonage.connected && status.n8n.connected && status.webhook.configured

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Integration Status
            </div>
            <Button 
              onClick={checkStatus} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time status of your Vonage and N8N integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {overallStatus ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              <span className="font-medium">Overall Status</span>
            </div>
            {overallStatus ? (
              <Badge variant="default" className="bg-green-100 text-green-800">All Systems Operational</Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">Issues Detected</Badge>
            )}
          </div>

          {/* Individual Services */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vonage Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.vonage.status)}
                    <span className="font-medium">Vonage API</span>
                  </div>
                  {getStatusBadge(status.vonage.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Voice API connection status
                </p>
                {status.vonage.lastTest && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last test: {new Date(status.vonage.lastTest).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* N8N Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.n8n.status)}
                    <span className="font-medium">N8N Workflow</span>
                  </div>
                  {getStatusBadge(status.n8n.status)}
                </div>
                <p className="text-sm text-gray-600">
                  N8N workflow connection status
                </p>
                {status.n8n.lastTest && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last test: {new Date(status.n8n.lastTest).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Webhook Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.webhook.status)}
                    <span className="font-medium">Webhook</span>
                  </div>
                  {getStatusBadge(status.webhook.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Webhook configuration status
                </p>
                {status.webhook.lastEvent && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last event: {new Date(status.webhook.lastEvent).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Details */}
          {!overallStatus && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Issues detected:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    {!status.vonage.connected && (
                      <li>Vonage API connection failed</li>
                    )}
                    {!status.n8n.connected && (
                      <li>N8N workflow connection failed</li>
                    )}
                    {!status.webhook.configured && (
                      <li>Webhook configuration issues</li>
                    )}
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">
                    Use the Connection Tester below to diagnose and fix these issues.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
