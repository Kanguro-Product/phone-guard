'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Wifi, 
  Phone, 
  Settings,
  Loader2
} from 'lucide-react'

interface ConnectionTest {
  success: boolean
  status: string
  message: string
  details: any
  timestamp: string
}

interface ConnectionTesterProps {
  onTestComplete?: (result: ConnectionTest) => void
}

export function ConnectionTester({ onTestComplete }: ConnectionTesterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, ConnectionTest>>({})
  const [testNumber, setTestNumber] = useState('34661216995')
  const [derivationId, setDerivationId] = useState('mobile-derivation-001')
  const [originNumber, setOriginNumber] = useState('34604579589')

  const runTest = async (testType: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/ab-caller/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testType,
          derivationId,
          originNumber,
          destinationNumber: testNumber
        })
      })

      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [testType]: result
      }))

      if (onTestComplete) {
        onTestComplete(result)
      }
    } catch (error) {
      const errorResult = {
        success: false,
        status: 'network_error',
        message: 'Network error occurred',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      }
      
      setTestResults(prev => ({
        ...prev,
        [testType]: errorResult
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'n8n_connected':
      case 'webhook_working':
      case 'full_call_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'n8n_login_failed':
      case 'webhook_failed':
      case 'full_call_failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'n8n_connection_error':
      case 'webhook_error':
      case 'full_call_error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'n8n_connected':
      case 'webhook_working':
      case 'full_call_success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'n8n_login_failed':
      case 'webhook_failed':
      case 'full_call_failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'n8n_connection_error':
      case 'webhook_error':
      case 'full_call_error':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const runAllTests = async () => {
    setIsLoading(true)
    
    // Run tests in sequence
    await runTest('login')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    
    await runTest('webhook')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    
    await runTest('full_call')
    
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Connection Tester
          </CardTitle>
          <CardDescription>
            Test your Vonage and N8N integration to ensure everything is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testNumber">Test Number</Label>
              <Input
                id="testNumber"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="34661216995"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="derivationId">Derivation ID</Label>
              <Input
                id="derivationId"
                value={derivationId}
                onChange={(e) => setDerivationId(e.target.value)}
                placeholder="mobile-derivation-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originNumber">Origin Number</Label>
              <Input
                id="originNumber"
                value={originNumber}
                onChange={(e) => setOriginNumber(e.target.value)}
                placeholder="34604579589"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runAllTests} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login">Login Test</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Test</TabsTrigger>
          <TabsTrigger value="full_call">Full Call Test</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                N8N Login Test
              </CardTitle>
              <CardDescription>
                Test the initial login connection to N8N
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResults.login && getStatusIcon(testResults.login.status)}
                  <span className="font-medium">N8N Connection</span>
                  {testResults.login && getStatusBadge(testResults.login.status)}
                </div>
                <Button 
                  onClick={() => runTest('login')} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Test Login
                </Button>
              </div>

              {testResults.login && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Status:</strong> {testResults.login.message}</p>
                      <p><strong>Timestamp:</strong> {new Date(testResults.login.timestamp).toLocaleString()}</p>
                      {testResults.login.details && (
                        <div className="mt-2">
                          <p><strong>Details:</strong></p>
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(testResults.login.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Webhook Test
              </CardTitle>
              <CardDescription>
                Test the webhook connection with N8N (test mode)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResults.webhook && getStatusIcon(testResults.webhook.status)}
                  <span className="font-medium">Webhook Connection</span>
                  {testResults.webhook && getStatusBadge(testResults.webhook.status)}
                </div>
                <Button 
                  onClick={() => runTest('webhook')} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Test Webhook
                </Button>
              </div>

              {testResults.webhook && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Status:</strong> {testResults.webhook.message}</p>
                      <p><strong>Timestamp:</strong> {new Date(testResults.webhook.timestamp).toLocaleString()}</p>
                      {testResults.webhook.details && (
                        <div className="mt-2">
                          <p><strong>Details:</strong></p>
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(testResults.webhook.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full_call" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Full Call Test
              </CardTitle>
              <CardDescription>
                Test a complete call flow with Vonage (real call)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {testResults.full_call && getStatusIcon(testResults.full_call.status)}
                  <span className="font-medium">Full Call Test</span>
                  {testResults.full_call && getStatusBadge(testResults.full_call.status)}
                </div>
                <Button 
                  onClick={() => runTest('full_call')} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Test Full Call
                </Button>
              </div>

              {testResults.full_call && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Status:</strong> {testResults.full_call.message}</p>
                      <p><strong>Timestamp:</strong> {new Date(testResults.full_call.timestamp).toLocaleString()}</p>
                      {testResults.full_call.details && (
                        <div className="mt-2">
                          <p><strong>Details:</strong></p>
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(testResults.full_call.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
